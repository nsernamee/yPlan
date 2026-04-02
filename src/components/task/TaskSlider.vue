<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useDragStore } from '@/stores/drag'
import type { Task, TaskSchedule } from '@/types'
import { TASK_COLORS, HOUR_HEIGHT, MIN_DURATION } from '@/utils/constants'
import { useDrag } from '@/composables/useDrag'
import { offsetToMinutes, offsetTime, calculateDuration } from '@/utils/time'

// 辅助函数：计算时间距离午夜的分钟数
function calculateMinutesFromMidnight(timeStr: string): number {
  const [hour, min] = timeStr.split(':').map(Number)
  return hour * 60 + min
}

const props = defineProps<{
  task: Task
  schedule: TaskSchedule
}>()

const emit = defineEmits<{
  'drag-end': [payload: { taskId: string; scheduleId: string; position: { x: number; y: number } }]
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
const colorStyle = computed(() => {
  if (isCustomColor.value) {
    // 自定义颜色：直接使用 hex 值
    return {
      bg: '',
      border: '',
      text: '',
      customBg: props.task.color,
      customBorder: props.task.color,
    }
  }
  // 预设颜色：使用 TASK_COLORS
  return TASK_COLORS[props.task.color as keyof typeof TASK_COLORS]
})

// 元素引用
const sliderRef = ref<HTMLElement | null>(null)

// 记录原始值
let originalTop = 0
let originalHeight = 60

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
  
  // 记录原始值（从父组件传入的 style）
  originalTop = parseFloat(el.style.top) || 0
  originalHeight = parseFloat(el.style.height) || 60
  
  // 清除父组件样式，使用内联样式完全控制
  if (type === 'resize-start' || type === 'resize-end') {
    el.style.top = `${originalTop}px`
    el.style.height = `${originalHeight}px`
  }
  
  startDrag(event, type, event.currentTarget as HTMLElement, {
    // 传递任务信息用于全局拖拽
    task: props.task,
    // 传递日程 ID
    scheduleId: props.schedule.id,
    // 传递日程时间用于预览
    startTime: props.schedule.startTime,
    endTime: props.schedule.endTime,
    // 初始为网格模式
    mode: 'grid',
    // 自由拖拽阈值
    freeDragThreshold: 10,
    // 是否允许自动切换到自由拖拽模式（周视图和月视图可以）
    allowAutoSwitchToFree: true,
    
    // 新版 2D 回调
    onMove2D: (offset, position) => {
      // 网格模式：仅垂直拖拽
      if (dragMode.value === 'grid') {
        if (type === 'move') {
          // 整体拖动时向下偏移，露出虚线提示
          const DRAG_OFFSET_Y = 16 // 向下偏移量
          
          // 边界检查：限制拖动范围，防止任务跨天
          const duration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          const startMinutes = calculateMinutesFromMidnight(props.schedule.startTime)
          const endMinutes = calculateMinutesFromMidnight(props.schedule.endTime)
          
          // 计算最大向上和向下移动距离（分钟）
          const maxUpMinutes = -startMinutes // 最大向上移动距离（到 00:00）
          const maxDownMinutes = (24 * 60) - endMinutes // 最大向下移动距离（到 23:59）
          
          // 将偏移量转换为分钟
          const deltaMinutes = offsetToMinutes(offset.y)
          
          // 限制偏移量
          const clampedDeltaMinutes = Math.max(maxUpMinutes, Math.min(deltaMinutes, maxDownMinutes))
          const clampedOffsetY = clampedDeltaMinutes * (HOUR_HEIGHT / 60)
          
          // 应用向下偏移
          el.style.transform = `translateY(${clampedOffsetY + DRAG_OFFSET_Y}px)`
          
          // 实时更新目标时间（注意：虚线位置不需要偏移）
          const newStartTime = offsetTime(props.schedule.startTime, clampedDeltaMinutes)
          dragStore.setTargetTime(newStartTime)
        } else if (type === 'resize-start') {
          // 计算边界：向下拖会缩短时长，需要限制向下拖的最大距离
          const currentDuration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          const maxDeltaMinutes = Math.max(0, currentDuration - MIN_DURATION)
          const maxDeltaPixels = maxDeltaMinutes * (HOUR_HEIGHT / 60)
          
          // 向下拖（offset.y > 0）时限制在 maxDeltaPixels 以内，向上拖不受限制
          const clampedOffsetY = offset.y > 0 ? Math.min(offset.y, maxDeltaPixels) : offset.y
          
          el.style.top = `${originalTop + clampedOffsetY}px`
          el.style.height = `${Math.max(MIN_DURATION * (HOUR_HEIGHT / 60), originalHeight - clampedOffsetY)}px`
        } else if (type === 'resize-end') {
          // 计算边界：向上拖会缩短时长，需要限制向上拖的最大距离
          const currentDuration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          const maxDeltaMinutes = Math.max(0, currentDuration - MIN_DURATION)
          const maxDeltaPixels = maxDeltaMinutes * (HOUR_HEIGHT / 60)
          
          // 向上拖（offset.y < 0）时限制在 -maxDeltaPixels 以内，向下拖不受限制
          const clampedOffsetY = offset.y < 0 ? Math.max(offset.y, -maxDeltaPixels) : offset.y
          
          el.style.height = `${Math.max(MIN_DURATION * (HOUR_HEIGHT / 60), originalHeight + clampedOffsetY)}px`
        }
      } else {
        // 自由模式：隐藏原任务（全局预览会显示）
        if (type === 'move') {
          el.style.opacity = '0'
          el.style.transform = ''
          
          // 实时更新目标时间
          const deltaMinutes = offsetToMinutes(offset.y)
          const newStartTime = offsetTime(props.schedule.startTime, deltaMinutes)
          dragStore.setTargetTime(newStartTime)
        }
      }
    },
    
    onEnd2D: (offset, moved, position) => {
      // 恢复样式
      el.style.transform = ''
      el.style.opacity = ''
      
      // 没有移动 = 点击操作
      if (!moved) {
        dragStore.setTargetTime(null)
        taskStore.openEditPanel(props.task, props.schedule)
        return
      }
      
      // 自由拖拽模式：由父组件处理日期变更
      if (dragMode.value === 'free' && type === 'move') {
        // 发送事件通知父组件（周/月视图）
        emit('drag-end', {
          taskId: props.task.id,
          scheduleId: props.schedule.id,
          position,
        })
        return
      }
      
      // 网格模式：仅处理时间变更
      const deltaMinutes = offsetToMinutes(offset.y)
      
      if (deltaMinutes !== 0) {
        if (type === 'move') {
          const duration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          const newStart = offsetTime(props.schedule.startTime, deltaMinutes)
          const newEnd = offsetTime(props.schedule.startTime, deltaMinutes + duration)
          
          // 边界检查：确保新时长为正数
          const newDuration = calculateDuration(newStart, newEnd)
          if (newDuration <= 0) {
            return
          }
          
          // 更新日程时间
          taskStore.updateSchedule({
            id: props.schedule.id,
            startTime: newStart,
            endTime: newEnd,
          })
        } else if (type === 'resize-start') {
          // 边界验证
          const currentDuration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          const maxDeltaMinutes = Math.max(0, currentDuration - MIN_DURATION)
          const clampedDeltaMinutes = deltaMinutes > 0 ? Math.min(deltaMinutes, maxDeltaMinutes) : deltaMinutes
          
          const newStart = offsetTime(props.schedule.startTime, clampedDeltaMinutes)
          taskStore.updateSchedule({
            id: props.schedule.id,
            startTime: newStart,
          })
        } else if (type === 'resize-end') {
          // 边界验证
          const currentDuration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
          const maxDeltaMinutes = Math.max(0, currentDuration - MIN_DURATION)
          const clampedDeltaMinutes = deltaMinutes < 0 ? Math.max(deltaMinutes, -maxDeltaMinutes) : deltaMinutes
          
          const newEnd = offsetTime(props.schedule.endTime, clampedDeltaMinutes)
          taskStore.updateSchedule({
            id: props.schedule.id,
            endTime: newEnd,
          })
        }
      }
      
      // 清除目标时间
      dragStore.setTargetTime(null)
    },
  })
}

// 组件卸载时清理
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
      class="absolute top-0 left-0 right-0 h-3 cursor-ns-resize z-20 group rounded-t-xl"
      @pointerdown.stop="(e) => handlePointerDown(e, 'resize-start')"
    >
      <div class="w-full h-full opacity-0 group-hover:opacity-100 bg-black/10 dark:bg-white/10 transition-opacity rounded-t-xl" />
    </div>

    <!-- 调整区域：底部 -->
    <div
      class="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize z-20 group rounded-b-xl"
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
