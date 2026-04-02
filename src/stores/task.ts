import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, CreateTaskParams, UpdateTaskParams, TaskColor } from '@/types'
import { isPlannedTask } from '@/types'
import * as db from '@/db'
import dayjs from 'dayjs'

export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const isPanelOpen = ref(false)
  const editingTask = ref<Task | null>(null)
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

  // 计算属性：当前选中日期的任务
  const currentDayTasks = computed(() => {
    return tasks.value
      .filter(task => {
        // 只显示已计划的任务
        if (!isPlannedTask(task)) return false
        return task.startDate! <= selectedDate.value && task.endDate! >= selectedDate.value
      })
      .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
  })

  // 计算属性：已计划任务列表
  const plannedTasks = computed(() => {
    return tasks.value.filter(task => isPlannedTask(task))
  })

  // 计算属性：未计划任务列表
  const unplannedTasks = computed(() => {
    return tasks.value.filter(task => !isPlannedTask(task))
  })

  // 初始化：加载所有任务
  async function loadTasks() {
    isLoading.value = true
    try {
      tasks.value = await db.getAllTasks()
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      isLoading.value = false
    }
  }

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

  // 更新任务
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

  // 删除任务
  async function deleteTask(id: string) {
    try {
      await db.deleteTask(id)
      tasks.value = tasks.value.filter(t => t.id !== id)
      closePanel()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  // 移动任务（拖拽）
  async function moveTask(taskId: string, newStartDate: string, newStartTime: string, newEndTime: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    await updateTask({
      id: taskId,
      startDate: newStartDate,
      endDate: newStartDate,
      startTime: newStartTime,
      endTime: newEndTime,
    })
  }

  // 将未计划任务加入日历（设置日期和默认时间）
  async function scheduleTask(taskId: string, date: string, startTime: string = '01:00', endTime: string = '02:00') {
    await updateTask({
      id: taskId,
      startDate: date,
      endDate: date,
      startTime,
      endTime,
    })
  }

  // 打开创建面板
  function openCreatePanel(date?: string, hour?: number) {
    editingTask.value = null
    selectedDate.value = date || dayjs().format('YYYY-MM-DD')
    isPanelOpen.value = true
  }

  // 打开创建面板（从任务列表创建，无时间）
  function openCreatePanelForList() {
    editingTask.value = null
    isPanelOpen.value = true
  }

  // 打开编辑面板
  function openEditPanel(task: Task) {
    editingTask.value = task
    isPanelOpen.value = true
  }

  // 关闭面板
  function closePanel() {
    isPanelOpen.value = false
    editingTask.value = null
  }

  // 设置选中日期
  function setSelectedDate(date: string) {
    selectedDate.value = date
  }

  // 获取指定日期范围的任务
  function getTasksByDateRange(startDate: string, endDate: string) {
    return tasks.value.filter(task => {
      // 只返回已计划的任务
      if (!isPlannedTask(task)) return false
      return task.startDate! <= endDate && task.endDate! >= startDate
    })
  }

  return {
    // 状态
    tasks,
    isLoading,
    isPanelOpen,
    editingTask,
    selectedDate,
    // 计算属性
    currentDayTasks,
    plannedTasks,
    unplannedTasks,
    // 方法
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    scheduleTask,
    openCreatePanel,
    openCreatePanelForList,
    openEditPanel,
    closePanel,
    setSelectedDate,
    getTasksByDateRange,
  }
})
