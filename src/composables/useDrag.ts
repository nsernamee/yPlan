import { ref, onUnmounted } from 'vue'
import { MOVE_THRESHOLD } from '@/utils/constants'

export type DragType = 'move' | 'resize-start' | 'resize-end'

export interface DragOptions {
  onMove?: (offsetY: number) => void
  onEnd?: (offsetY: number, hasMoved: boolean) => void
}

export function useDrag() {
  const isDragging = ref(false)
  const dragType = ref<DragType | null>(null)
  const hasMoved = ref(false)

  /**
   * 开始拖拽
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

    element.setPointerCapture(event.pointerId)

    const startY = event.clientY
    let totalOffsetY = 0

    function handlePointerMove(e: PointerEvent) {
      const offsetY = e.clientY - startY
      totalOffsetY = offsetY

      if (Math.abs(offsetY) > MOVE_THRESHOLD) {
        hasMoved.value = true
      }

      options.onMove?.(offsetY)
    }

    function handlePointerUp(e: PointerEvent) {
      element.releasePointerCapture(e.pointerId)

      options.onEnd?.(totalOffsetY, hasMoved.value)

      // 重置状态
      isDragging.value = false
      dragType.value = null
      hasMoved.value = false

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
  })

  return {
    isDragging,
    dragType,
    hasMoved,
    startDrag,
  }
}
