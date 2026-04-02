import { ref, onUnmounted } from 'vue'
import { MOVE_THRESHOLD } from '@/utils/constants'
import { useDragStore, type DragMode } from '@/stores/drag'
import type { Task, TaskSchedule, DragType } from '@/types'

export type { DragType }

// 2D 偏移量
export interface DragOffset {
  x: number
  y: number
}

// 绝对坐标
export interface DragPosition {
  x: number
  y: number
}

// 扩展的拖拽选项
export interface DragOptions {
  // 旧版回调（向后兼容）
  onMove?: (offsetY: number) => void
  onEnd?: (offsetY: number, hasMoved: boolean) => void
  // 新版回调（2D 支持）
  onMove2D?: (offset: DragOffset, position: DragPosition) => void
  onEnd2D?: (offset: DragOffset, hasMoved: boolean, position: DragPosition) => void
  // 拖拽模式
  mode?: DragMode
  // 任务信息（用于全局拖拽）
  task?: Task
  // 日程信息（用于全局拖拽，标识正在拖拽哪个日程实例）
  scheduleId?: string
  // 日程时间（用于全局拖拽预览）
  startTime?: string
  endTime?: string
  // 自由拖拽阈值
  freeDragThreshold?: number
  // 是否允许自动切换到自由拖拽模式（默认 false）
  allowAutoSwitchToFree?: boolean
}

export function useDrag() {
  const isDragging = ref(false)
  const dragType = ref<DragType | null>(null)
  const hasMoved = ref(false)
  const dragMode = ref<DragMode>('grid')

  const dragStore = useDragStore()

  /**
   * 开始拖拽（支持 2D 和模式切换）
   */
  function startDrag(
    event: PointerEvent,
    type: DragType,
    element: HTMLElement,
    options: DragOptions = {}
  ) {
    // 只响应左键
    if (event.button !== 0 && event.button !== undefined) return

    event.preventDefault()

    isDragging.value = true
    dragType.value = type
    hasMoved.value = false
    dragMode.value = options.mode || 'grid'

    element.setPointerCapture(event.pointerId)

    const startX = event.clientX
    const startY = event.clientY
    let totalOffsetX = 0
    let totalOffsetY = 0

    // 如果提供了任务信息，初始化全局拖拽状态
    if (options.task) {
      console.log('Calling dragStore.startDrag', { 
        task: options.task.title, 
        scheduleId: options.scheduleId,
        startTime: options.startTime,
        endTime: options.endTime,
        type, 
        mode: dragMode.value 
      })
      dragStore.startDrag({
        task: options.task,
        scheduleId: options.scheduleId,
        startTime: options.startTime,
        endTime: options.endTime,
        type,
        mode: dragMode.value,
        startPosition: { x: startX, y: startY },
      })
      console.log('After dragStore.startDrag', {
        isDragging: dragStore.isDragging,
        dragMode: dragStore.dragMode,
        hasDraggingTask: !!dragStore.draggingTask,
        draggingScheduleId: dragStore.draggingScheduleId
      })
    }

    function handlePointerMove(e: PointerEvent) {
      const offsetX = e.clientX - startX
      const offsetY = e.clientY - startY
      totalOffsetX = offsetX
      totalOffsetY = offsetY

      // 检测是否移动超过阈值
      const threshold = options.freeDragThreshold || MOVE_THRESHOLD
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
      
      if (distance > threshold) {
        hasMoved.value = true
      }

      // 只在明确允许时才自动切换到自由拖拽模式
      // 日视图不允许切换，周视图和月视图可以切换
      if (options.allowAutoSwitchToFree && dragMode.value === 'grid' && distance > 50 && type === 'move') {
        dragMode.value = 'free'
        // 更新 dragStore 的 dragMode
        dragStore.$patch({ dragMode: 'free' })
        console.log('Switched to free mode in useDrag', { 
          dragMode: dragMode.value,
          storeDragMode: dragStore.dragMode 
        })
      }

      // 更新全局拖拽位置
      if (options.task) {
        dragStore.updatePosition({ x: e.clientX, y: e.clientY })
      }

      // 调用回调
      if (options.onMove2D) {
        options.onMove2D({ x: offsetX, y: offsetY }, { x: e.clientX, y: e.clientY })
      } else if (options.onMove) {
        // 向后兼容
        options.onMove(offsetY)
      }
    }

    function handlePointerUp(e: PointerEvent) {
      element.releasePointerCapture(e.pointerId)

      // 调用结束回调（注意：不要在 onEnd2D 中清空 dragStore 状态）
      if (options.onEnd2D) {
        options.onEnd2D(
          { x: totalOffsetX, y: totalOffsetY },
          hasMoved.value,
          { x: e.clientX, y: e.clientY }
        )
      } else if (options.onEnd) {
        // 向后兼容
        options.onEnd(totalOffsetY, hasMoved.value)
      }

      // 清理全局拖拽状态（在 onEnd2D 之后，确保父组件可以先读取状态）
      if (options.task) {
        dragStore.endDrag()
      }

      // 重置状态
      isDragging.value = false
      dragType.value = null
      hasMoved.value = false
      dragMode.value = 'grid'

      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  // 组件卸载时清理
  onUnmounted(() => {
    isDragging.value = false
    dragType.value = null
    hasMoved.value = false
    dragMode.value = 'grid'
  })

  return {
    isDragging,
    dragType,
    hasMoved,
    dragMode,
    startDrag,
  }
}
