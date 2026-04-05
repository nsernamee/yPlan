import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskSchedule, DragType } from '@/types'

export type DragMode = 'grid' | 'free'

export interface DragPosition {
  x: number
  y: number
}

export interface DragOffset {
  x: number
  y: number
}

export const useDragStore = defineStore('drag', () => {
  // 拖拽状态
  const isDragging = ref(false)
  const dragMode = ref<DragMode>('grid')
  const dragType = ref<DragType | null>(null)
  const hasMoved = ref(false)
  const isDraggingFromList = ref(false) // 是否从任务列表拖拽

  // 拖拽任务和日程信息
  const draggingTask = ref<Task | null>(null)
  const draggingScheduleId = ref<string | null>(null)
  const draggingStartTime = ref<string | null>(null)
  const draggingEndTime = ref<string | null>(null)
  const originalPosition = ref<DragPosition>({ x: 0, y: 0 })
  const currentPosition = ref<DragPosition>({ x: 0, y: 0 })
  const offset = ref<DragOffset>({ x: 0, y: 0 })

  // 目标信息
  const targetDate = ref<string | null>(null)
  const targetTime = ref<string | null>(null)

  // 计算属性
  const isFreeDrag = computed(() => dragMode.value === 'free')
  const isGridDrag = computed(() => dragMode.value === 'grid')

  // 开始拖拽（支持日程）
  function startDrag(params: {
    task: Task
    scheduleId?: string
    startTime?: string
    endTime?: string
    type: DragType
    mode: DragMode
    startPosition: DragPosition
  }) {
    isDragging.value = true
    dragMode.value = params.mode
    dragType.value = params.type
    hasMoved.value = false
    isDraggingFromList.value = false
    draggingTask.value = params.task
    draggingScheduleId.value = params.scheduleId || null
    draggingStartTime.value = params.startTime || null
    draggingEndTime.value = params.endTime || null
    originalPosition.value = params.startPosition
    currentPosition.value = params.startPosition
    offset.value = { x: 0, y: 0 }
  }

  // 从任务列表开始拖拽
  function startDragFromList(task: Task, position: DragPosition) {
    isDragging.value = true
    dragMode.value = 'free' // 从列表拖出使用自由模式
    dragType.value = 'move'
    hasMoved.value = true
    isDraggingFromList.value = true
    draggingTask.value = task
    draggingScheduleId.value = null // 从列表拖出的任务没有日程
    // 设置初始位置
    originalPosition.value = position
    currentPosition.value = position
    offset.value = { x: 0, y: 0 }
  }

  // 更新拖拽位置
  function updatePosition(position: DragPosition) {
    currentPosition.value = position
    offset.value = {
      x: position.x - originalPosition.value.x,
      y: position.y - originalPosition.value.y,
    }

    // 检测是否移动超过阈值
    if (Math.abs(offset.value.x) > 5 || Math.abs(offset.value.y) > 5) {
      hasMoved.value = true
    }
  }

  // 设置目标日期
  function setTargetDate(date: string | null) {
    targetDate.value = date
  }

  // 设置目标时间
  function setTargetTime(time: string | null) {
    targetTime.value = time
  }

  // 结束拖拽
  function endDrag() {
    isDragging.value = false
    dragMode.value = 'grid'
    dragType.value = null
    hasMoved.value = false
    isDraggingFromList.value = false
    draggingTask.value = null
    draggingScheduleId.value = null
    draggingStartTime.value = null
    draggingEndTime.value = null
    originalPosition.value = { x: 0, y: 0 }
    currentPosition.value = { x: 0, y: 0 }
    offset.value = { x: 0, y: 0 }
    targetDate.value = null
    targetTime.value = null
  }

  // 切换拖拽模式
  function toggleDragMode() {
    dragMode.value = dragMode.value === 'grid' ? 'free' : 'grid'
  }

  return {
    // 状态
    isDragging,
    dragMode,
    dragType,
    hasMoved,
    isDraggingFromList,
    draggingTask,
    draggingScheduleId,
    draggingStartTime,
    draggingEndTime,
    originalPosition,
    currentPosition,
    offset,
    targetDate,
    targetTime,
    // 计算属性
    isFreeDrag,
    isGridDrag,
    // 方法
    startDrag,
    startDragFromList,
    updatePosition,
    setTargetDate,
    setTargetTime,
    endDrag,
    toggleDragMode,
  }
})
