import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, DragType } from '@/types'

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

  // 拖拽任务信息
  const draggingTask = ref<Task | null>(null)
  const originalPosition = ref<DragPosition>({ x: 0, y: 0 })
  const currentPosition = ref<DragPosition>({ x: 0, y: 0 })
  const offset = ref<DragOffset>({ x: 0, y: 0 })

  // 目标信息
  const targetDate = ref<string | null>(null)
  const targetTime = ref<string | null>(null)

  // 计算属性
  const isFreeDrag = computed(() => dragMode.value === 'free')
  const isGridDrag = computed(() => dragMode.value === 'grid')

  // 开始拖拽
  function startDrag(params: {
    task: Task
    type: DragType
    mode: DragMode
    startPosition: DragPosition
  }) {
    isDragging.value = true
    dragMode.value = params.mode
    dragType.value = params.type
    hasMoved.value = false
    draggingTask.value = params.task
    originalPosition.value = params.startPosition
    currentPosition.value = params.startPosition
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
    draggingTask.value = null
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
    draggingTask,
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
    updatePosition,
    setTargetDate,
    setTargetTime,
    endDrag,
    toggleDragMode,
  }
})
