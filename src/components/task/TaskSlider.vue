<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useDragStore } from '@/stores/drag'
import type { Task, TaskSchedule } from '@/types'
import { TASK_COLORS, HOUR_HEIGHT, MIN_DURATION, TIME_START_HOUR, TIME_END_HOUR, TIME_AXIS_HOURS } from '@/utils/constants'
import type { TaskColorStyle } from '@/types'
import { useDrag } from '@/composables/useDrag'
import { offsetToMinutes, offsetTime, calculateDuration, calculateTaskPosition, clampTime, pixelsToTime } from '@/utils/time'

const props = defineProps<{
  task: Task
  schedule: TaskSchedule
}>()

const emit = defineEmits<{
  'drag-end': [payload: { taskId: string; scheduleId: string; position: { x: number; y: number }; startTime?: string; endTime?: string }]
}>()

const taskStore = useTaskStore()
const dragStore = useDragStore()
const { isDragging, dragType, hasMoved, dragMode, startDrag } = useDrag()

// 预设颜色
const presetColors = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

// 判断是否为自定义颜色
const isCustomColor = computed(() => {
  return !presetColors.includes(props.task.color)
})

// 颜色样式
const colorStyle = computed((): TaskColorStyle => {
  if (isCustomColor.value) {
    return {
      bg: '',
      border: '',
      text: '',
      customBg: props.task.color,
      customBorder: props.task.color,
    }
  }
  return { ...TASK_COLORS[props.task.color as keyof typeof TASK_COLORS], customBg: '', customBorder: '' }
})

// 元素引用
const sliderRef = ref<HTMLElement | null>(null)

// 记录原始值（在 handlePointerDown 中从 props 计算）
let originalTop = 0
let originalHeight = 60

// move 操作的最终像素位置（用于 onEnd2D 精确保存）
let moveFinalPixelY = 0

// 时间轴像素范围（用于软限制）
function getTimeAxisPixelRange() {
  return { minPx: 0, maxPx: TIME_AXIS_HOURS * HOUR_HEIGHT }
}

// 时间显示（从 schedule 读取）
const timeDisplay = computed(() => {
  return `${props.schedule.startTime} - ${props.schedule.endTime}`
})

// 拖拽时的实时时间预览
const previewTime = computed(() => {
  if (!isDragging.value || dragType.value === 'move') return null
  
  // 从 DOM 获取当前偏移
  const transform = sliderRef.value?.style.transform || ''
  const match = transform.match(/translateY\(([-\d.]+)px\)/)
  const offsetY = match ? parseFloat(match[1]) : 0
  
  const deltaMinutes = offsetToMinutes(offsetY)
  
  if (dragType.value === 'resize-start') {
    const newStart = offsetTime(props.schedule.startTime, deltaMinutes)
    return { type: 'start' as const, time: newStart }
  } else if (dragType.value === 'resize-end') {
    const newEnd = offsetTime(props.schedule.endTime, deltaMinutes)
    return { type: 'end' as const, time: newEnd }
  }
  return null
})

// 开始拖拽
function handlePointerDown(event: PointerEvent, type: 'move' | 'resize-start' | 'resize-end') {
  if (!sliderRef.value) return

  // 阻止事件冒泡，避免触发父容器的 handleTimeAxisClick
  event.stopPropagation()
  
  const el = sliderRef.value
  
  // 从 props 数据计算原始位置，不依赖 DOM（避免拖拽残存值污染）
  if (type === 'resize-start' || type === 'resize-end') {
    const pos = calculateTaskPosition(props.schedule.startTime, props.schedule.endTime)
    originalTop = pos.top
    originalHeight = pos.height
    
    // 清除可能残留的 inline 样式
    el.style.top = ''
    el.style.height = ''
  }

  startDrag(event, type, event.currentTarget as HTMLElement, {
    task: props.task,
    scheduleId: props.schedule.id,
    startTime: props.schedule.startTime,
    endTime: props.schedule.endTime,
    mode: 'grid',
    freeDragThreshold: 10,
    allowAutoSwitchToFree: true,

    onMove2D: (offset) => {
      // 视觉层在 grid/free 模式下都需要实时更新（卡片必须跟随鼠标）
      const { minPx, maxPx } = getTimeAxisPixelRange()
      const minHeightPx = MIN_DURATION * (HOUR_HEIGHT / 60)

      if (type === 'move') {
        // 整体移动：纯像素级软限制，不调用 offsetTime/clampTime（避免拖动时被钳位卡住）
        const DRAG_OFFSET_Y = 16
        
        // 直接用 calculateTaskPosition 的返回值（已包含 clampTime，与视觉高度完全一致）
        const { top: startTop, height: cardHeight } = calculateTaskPosition(
          props.schedule.startTime,
          props.schedule.endTime
        )

        let newY = startTop + offset.y
        
        // 像素级软限制：整体不能超出时间轴范围
        if (newY < minPx) newY = minPx
        if (newY + cardHeight > maxPx) newY = maxPx - cardHeight

        // free 模式下隐藏原卡片（由全局 DragPreview 接管显示）
        // grid 模式下原卡片通过 transform 跟随鼠标
        if (dragMode.value === 'free') {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
        } else {
          el.style.transform = `translateY(${newY - startTop + DRAG_OFFSET_Y}px)`
        }
        
        // 记录最终像素位置（供 onEnd2D 精确反算时间）
        moveFinalPixelY = newY
        
        // 预览时间：基于最终像素位置反算（与视觉效果一致）
        dragStore.setTargetTime(pixelsToTime(newY))

      } else if (type === 'resize-start') {
        // 调整开始边缘：top 不能 < 0，height >= minHeightPx，top 不能超过 bottom-minHeightPx
        let newTop = originalTop + offset.y
        let newHeight = originalHeight - offset.y

        if (newTop < minPx) {
          newHeight += (minPx - newTop)
          newTop = minPx
        }
        if (newTop > maxPx - minHeightPx) {
          newTop = maxPx - minHeightPx
          newHeight = minHeightPx
        }
        if (newHeight < minHeightPx) {
          newHeight = minHeightPx
        }

        el.style.top = `${newTop}px`
        el.style.height = `${newHeight}px`

      } else if (type === 'resize-end') {
        // 调整结束边缘：bottom 不能 > maxPx，height >= minHeightPx，bottom 不能 < top+minHeightPx
        let newHeight = originalHeight + offset.y
        let newBottom = originalTop + newHeight

        if (newBottom > maxPx) {
          newHeight = maxPx - originalTop
        }
        if (newBottom < originalTop + minHeightPx) {
          newHeight = minHeightPx
        }
        if (newHeight < minHeightPx) {
          newHeight = minHeightPx
        }

        el.style.height = `${newHeight}px`
      }
    },

    onEnd2D: (offset, moved, position) => {
      // 恢复所有内联样式
      el.style.transform = ''
      el.style.opacity = ''
      el.style.pointerEvents = ''
      if (type === 'resize-start' || type === 'resize-end') {
        el.style.top = ''
        el.style.height = ''
      }

      // 没有移动 = 点击操作
      if (!moved) {
        dragStore.setTargetTime(null)
        taskStore.openEditPanel(props.task, props.schedule)
        return
      }

      // 自由拖拽模式：计算新时间并通过 emit 传递给父组件（父组件统一保存，避免异步竞态）
      if (dragMode.value === 'free' && type === 'move') {
        let newStart = clampTime(pixelsToTime(moveFinalPixelY))
        const duration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
        let newEnd = clampTime(offsetTime(newStart, duration))

        // 检测 endTime 是否因 clamp 回绕
        const startMin = (() => { const [h,m] = newStart.split(':').map(Number); return h*60+m })()
        const endMin = (() => { const [h,m] = newEnd.split(':').map(Number); return h*60+m })()
        if (endMin < startMin) {
          newEnd = `${TIME_END_HOUR.toString().padStart(2, '0')}:59`
          const adjustedStartMin = endMin - Math.min(duration, TIME_END_HOUR * 60 + 59 - TIME_START_HOUR * 60 - MIN_DURATION)
          if (adjustedStartMin >= TIME_START_HOUR * 60) {
            newStart = `${Math.floor(adjustedStartMin / 60).toString().padStart(2, '0')}:${(adjustedStartMin % 60).toString().padStart(2, '0')}`
          }
        }

        dragStore.setTargetTime(null)
        // 通过 payload 直接传递新时间数据，让父组件一次性保存（时间+日期）
        emit('drag-end', {
          taskId: props.task.id,
          scheduleId: props.schedule.id,
          position,
          startTime: newStart,
          endTime: newEnd,
        })
        return
      }

      // 网格模式：统一使用 clampTime 处理所有时间变更
      const deltaMinutes = offsetToMinutes(offset.y)

      if (deltaMinutes !== 0 || type !== 'move') {
        if (type === 'move') {
          // 基于最终像素位置反算时间（与拖动视觉效果100%一致）
          let newStart = clampTime(pixelsToTime(moveFinalPixelY))
          // 保持原始持续时间
          const duration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          let newEnd = clampTime(offsetTime(newStart, duration))

          // 关键：检测 endTime 是否因 clamp 回绕（如 23:40 + duration → 00:30 → clamp → 06:00）
          const startMin = (() => { const [h,m] = newStart.split(':').map(Number); return h*60+m })()
          const endMin = (() => { const [h,m] = newEnd.split(':').map(Number); return h*60+m })()
          if (endMin < startMin) {
            // 回绕了：锁定 endTime 到时间轴底部，回退 startTime
            newEnd = `${TIME_END_HOUR.toString().padStart(2, '0')}:59`
            const adjustedStartMin = endMin - Math.min(duration, TIME_END_HOUR * 60 + 59 - TIME_START_HOUR * 60 - MIN_DURATION)
            if (adjustedStartMin >= TIME_START_HOUR * 60) {
              newStart = `${Math.floor(adjustedStartMin / 60).toString().padStart(2, '0')}:${(adjustedStartMin % 60).toString().padStart(2, '0')}`
            }
          }

          taskStore.updateSchedule({
            id: props.schedule.id,
            startTime: newStart,
            endTime: newEnd,
          })
          // 注意：grid 模式 move 不需要 emit('drag-end')，因为不需要跨日期移动
          // targetTime 会在函数末尾统一清除（line 277）

        } else if (type === 'resize-start') {
          const newStart = clampTime(offsetTime(props.schedule.startTime, deltaMinutes))
          // 确保不晚于结束时间
          const endMinTotal = (() => { const [h,m] = props.schedule.endTime.split(':').map(Number); return h*60+m })()
          const startMinTotal = (() => { const [h,m] = newStart.split(':').map(Number); return h*60+m })()
          
          if (startMinTotal >= endMinTotal - MIN_DURATION) {
            // 拉过了结束时间，回退到结束时间之前的最小间隔
            const finalStart = offsetTime(props.schedule.endTime, -(MIN_DURATION + 1))
            taskStore.updateSchedule({ id: props.schedule.id, startTime: finalStart })
          } else {
            taskStore.updateSchedule({ id: props.schedule.id, startTime: newStart })
          }

        } else if (type === 'resize-end') {
          const newEnd = clampTime(offsetTime(props.schedule.endTime, deltaMinutes))
          // 确保不早于开始时间
          const startMinTotal = (() => { const [h,m] = props.schedule.startTime.split(':').map(Number); return h*60+m })()
          const endMinTotal = (() => { const [h,m] = newEnd.split(':').map(Number); return h*60+m })()

          if (endMinTotal <= startMinTotal + MIN_DURATION) {
            // 拉到了开始时间之前或太近，推进到开始时间之后的最小间隔
            const finalEnd = offsetTime(props.schedule.startTime, MIN_DURATION + 1)
            taskStore.updateSchedule({ id: props.schedule.id, endTime: finalEnd })
          } else {
            taskStore.updateSchedule({ id: props.schedule.id, endTime: newEnd })
          }
        }
      }

      dragStore.setTargetTime(null)
    },
  })
}

onUnmounted(() => {
  isDragging.value = false
  dragType.value = null
})
</script>

<template>
  <div
    ref="sliderRef"
    :class="[
      'task-slider rounded-xl border-l-4 overflow-hidden',
      !isCustomColor && colorStyle.bg,
      !isCustomColor && colorStyle.border,
      'glass-light',
      'dark:glass-light-dark',
      {
        'cursor-grab active:cursor-grabbing': !isDragging || dragType === 'move',
        'cursor-ns-resize': isDragging && (dragType === 'resize-start' || dragType === 'resize-end'),
        'dragging': isDragging,
        'dragging-move': isDragging && dragType === 'move',
        'dragging-resize': isDragging && (dragType === 'resize-start' || dragType === 'resize-end')
      }
    ]"
    :style="isCustomColor ? {
      backgroundColor: `${colorStyle.customBg}20`,
      borderLeftColor: colorStyle.customBorder
    } : undefined"
    @pointerdown="(e) => handlePointerDown(e, 'move')"
    @click.stop
  >
    <!-- 内容区域 -->
    <div class="relative h-full flex flex-col p-2 pointer-events-none">
      <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {{ task.title }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {{ timeDisplay }}
      </div>
    </div>

    <!-- 调整区域：顶部 -->
    <div
      class="absolute top-0 left-0 right-0 h-4 md:h-3 cursor-ns-resize z-20 group rounded-t-xl"
      @pointerdown.stop="(e) => handlePointerDown(e, 'resize-start')"
    >
      <div class="w-full h-full opacity-0 group-hover:opacity-100 bg-black/10 dark:bg-white/10 transition-opacity rounded-t-xl" />
    </div>

    <!-- 调整区域：底部 -->
    <div
      class="absolute bottom-0 left-0 right-0 h-4 md:h-3 cursor-ns-resize z-20 group rounded-b-xl"
      @pointerdown.stop="(e) => handlePointerDown(e, 'resize-end')"
    >
      <div class="w-full h-full opacity-0 group-hover:opacity-100 bg-black/10 dark:bg-white/10 transition-opacity rounded-b-xl" />
    </div>

    <!-- 时间提示气泡 -->
    <div
      v-if="previewTime"
      :class="[
        'absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium text-white shadow-lg z-50 whitespace-nowrap animate-scale-in',
        previewTime.type === 'start' ? 'bg-primary top-0 -translate-y-full' : 'bg-success bottom-0 translate-y-full'
      ]"
    >
      {{ previewTime.time }}
    </div>
  </div>
</template>

<style scoped>
.task-slider {
  user-select: none;
  touch-action: none;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), top 0.2s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease-out;
}

.task-slider:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-slider.dragging {
  transition: none;
}

.task-slider.dragging-move {
  z-index: 100;
  box-shadow: 0 12px 32px rgba(0, 82, 217, 0.35);
}

.task-slider.dragging-resize {
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.task-slider.dragging-spring {
  animation: springBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes springBounce {
  0% {
    transform: scale(1.02);
  }
  30% {
    transform: scale(0.98);
  }
  50% {
    transform: scale(1.01);
  }
  70% {
    transform: scale(0.995);
  }
  100% {
    transform: scale(1);
  }
}
</style>
