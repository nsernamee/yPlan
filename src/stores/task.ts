import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskSchedule, TaskWithSchedule, CreateTaskParams, UpdateTaskParams, CreateScheduleParams, UpdateScheduleParams } from '@/types'
import * as db from '@/db'
import dayjs from 'dayjs'

export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const schedules = ref<TaskSchedule[]>([])
  const isLoading = ref(false)
  const isPanelOpen = ref(false)
  const editingTask = ref<Task | null>(null)
  const editingSchedule = ref<TaskSchedule | null>(null)
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

  // ========== 计算属性 ==========

  // 当前选中日期的日程实例（TaskWithSchedule[]）
  const currentDayTasks = computed(() => {
    return getScheduleInstancesForDate(selectedDate.value)
  })

  // 已计划任务列表（有日程的任务）
  const plannedTasks = computed(() => {
    const scheduledTaskIds = new Set(schedules.value.map(s => s.taskId))
    return tasks.value.filter(task => scheduledTaskIds.has(task.id))
  })

  // 未计划任务列表（无日程的任务）
  const unplannedTasks = computed(() => {
    const scheduledTaskIds = new Set(schedules.value.map(s => s.taskId))
    return tasks.value.filter(task => !scheduledTaskIds.has(task.id))
  })

  // ========== 初始化 ==========

  // 加载所有任务和日程
  async function loadTasks() {
    isLoading.value = true
    try {
      const [loadedTasks, loadedSchedules] = await Promise.all([
        db.getAllTasks(),
        db.getAllSchedules(),
      ])
      tasks.value = loadedTasks
      schedules.value = loadedSchedules
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      isLoading.value = false
    }
  }

  // ========== Task CRUD ==========

  // 创建任务
  async function createTask(params: CreateTaskParams) {
    const now = Date.now()
    const task: Task = {
      id: db.generateId(),
      ...params,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await db.createTask(task)
      tasks.value.push(task)
      closePanel()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // 更新任务（仅更新任务属性，不影响日程）
  async function updateTask(params: UpdateTaskParams) {
    const task = tasks.value.find(t => t.id === params.id)
    if (!task) return

    const updatedTask: Task = {
      ...task,
      ...params,
      updatedAt: Date.now(),
    }

    try {
      await db.updateTask(updatedTask)
      const index = tasks.value.findIndex(t => t.id === params.id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  // 删除任务（级联删除所有日程）
  async function deleteTask(id: string) {
    try {
      // 删除所有关联日程
      await db.deleteSchedulesByTaskId(id)
      schedules.value = schedules.value.filter(s => s.taskId !== id)

      // 删除任务
      await db.deleteTask(id)
      tasks.value = tasks.value.filter(t => t.id !== id)

      closePanel()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  // ========== TaskSchedule CRUD ==========

  // 为任务创建日程
  async function scheduleTaskOnDate(taskId: string, date: string, startTime: string = '01:00', endTime: string = '02:00') {
    const schedule: TaskSchedule = {
      id: db.generateId(),
      taskId,
      date,
      startTime,
      endTime,
    }

    try {
      await db.createSchedule(schedule)
      schedules.value.push(schedule)
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }

  // 更新日程
  async function updateSchedule(params: UpdateScheduleParams) {
    const schedule = schedules.value.find(s => s.id === params.id)
    if (!schedule) return

    const updatedSchedule: TaskSchedule = {
      ...schedule,
      ...params,
    }

    try {
      await db.updateSchedule(updatedSchedule)
      const index = schedules.value.findIndex(s => s.id === params.id)
      if (index !== -1) {
        schedules.value[index] = updatedSchedule
      }
    } catch (error) {
      console.error('Failed to update schedule:', error)
    }
  }

  // 删除单个日程
  async function removeSchedule(id: string) {
    try {
      await db.deleteSchedule(id)
      schedules.value = schedules.value.filter(s => s.id !== id)
    } catch (error) {
      console.error('Failed to remove schedule:', error)
    }
  }

  // 删除任务的所有日程
  async function removeAllSchedules(taskId: string) {
    try {
      await db.deleteSchedulesByTaskId(taskId)
      schedules.value = schedules.value.filter(s => s.taskId !== taskId)
    } catch (error) {
      console.error('Failed to remove all schedules:', error)
    }
  }

  // ========== 查询方法 ==========

  // 获取任务的所有日程
  function getTaskSchedules(taskId: string): TaskSchedule[] {
    return schedules.value.filter(s => s.taskId === taskId)
  }

  // 判断任务是否有日程
  function isTaskScheduled(taskId: string): boolean {
    return schedules.value.some(s => s.taskId === taskId)
  }

  // 获取指定日期的日程实例（返回 TaskWithSchedule[]）
  function getScheduleInstancesForDate(dateStr: string): TaskWithSchedule[] {
    const daySchedules = schedules.value.filter(s => s.date === dateStr)
    const result: TaskWithSchedule[] = []

    for (const schedule of daySchedules) {
      const task = tasks.value.find(t => t.id === schedule.taskId)
      if (task) {
        result.push({ task, schedule })
      }
    }

    // 按开始时间排序
    return result.sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime))
  }

  // 获取指定日期范围的日程实例
  function getScheduleInstancesByDateRange(startDate: string, endDate: string): TaskWithSchedule[] {
    const result: TaskWithSchedule[] = []

    for (const schedule of schedules.value) {
      if (schedule.date >= startDate && schedule.date <= endDate) {
        const task = tasks.value.find(t => t.id === schedule.taskId)
        if (task) {
          result.push({ task, schedule })
        }
      }
    }

    return result.sort((a, b) => {
      // 先按日期排序，再按时间排序
      if (a.schedule.date !== b.schedule.date) {
        return a.schedule.date.localeCompare(b.schedule.date)
      }
      return a.schedule.startTime.localeCompare(b.schedule.startTime)
    })
  }

  // ========== 面板控制 ==========

  // 打开创建面板
  function openCreatePanel(date?: string, hour?: number) {
    editingTask.value = null
    editingSchedule.value = null
    selectedDate.value = date || dayjs().format('YYYY-MM-DD')
    isPanelOpen.value = true
  }

  // 打开创建面板（从任务列表创建，无时间）
  function openCreatePanelForList() {
    editingTask.value = null
    editingSchedule.value = null
    isPanelOpen.value = true
  }

  // 打开编辑面板（可同时编辑任务和日程）
  function openEditPanel(task: Task, schedule?: TaskSchedule) {
    editingTask.value = task
    editingSchedule.value = schedule || null
    isPanelOpen.value = true
  }

  // 关闭面板
  function closePanel() {
    isPanelOpen.value = false
    editingTask.value = null
    editingSchedule.value = null
  }

  // 设置选中日期
  function setSelectedDate(date: string) {
    selectedDate.value = date
  }

  return {
    // 状态
    tasks,
    schedules,
    isLoading,
    isPanelOpen,
    editingTask,
    editingSchedule,
    selectedDate,
    // 计算属性
    currentDayTasks,
    plannedTasks,
    unplannedTasks,
    // Task 方法
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    // Schedule 方法
    scheduleTaskOnDate,
    updateSchedule,
    removeSchedule,
    removeAllSchedules,
    // 查询方法
    getTaskSchedules,
    isTaskScheduled,
    getScheduleInstancesForDate,
    getScheduleInstancesByDateRange,
    // 面板控制
    openCreatePanel,
    openCreatePanelForList,
    openEditPanel,
    closePanel,
    setSelectedDate,
  }
})
