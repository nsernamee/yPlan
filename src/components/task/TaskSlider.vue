<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { Task } from '@/types'
import { TASK_COLORS } from '@/utils/constants'
import { useDrag } from '@/composables/useDrag'
import { offsetToMinutes, offsetTime, calculateDuration } from '@/utils/time'

const props = defineProps<{
  task: Task
}>()

const taskStore = useTaskStore()
const { isDragging, dragType, hasMoved, startDrag } = useDrag()

// 颜色样式
const colorStyle = computed(() => TASK_COLORS[props.task.color])

// 元素引用
const sliderRef = ref<HTMLElement | null>(null)

// 记录原始值
let originalTop = 0
let originalHeight = 60

// 时间显示
const timeDisplay = computed(() => {
  return `${props.task.startTime} - ${props.task.endTime}`
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
    const newStart = offsetTime(props.task.startTime, deltaMinutes)
    return { type: 'start' as const, time: newStart }
  } else if (dragType.value === 'resize-end') {
    const newEnd = offsetTime(props.task.endTime, deltaMinutes)
    return { type: 'end' as const, time: newEnd }
  }
  return null
})

// 开始拖拽
function handlePointerDown(event: PointerEvent, type: 'move' | 'resize-start' | 'resize-end') {
  if (!sliderRef.value) return
  
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
    onMove: (offsetY) => {
      // 直接操作 DOM
      if (type === 'move') {
        el.style.transform = `translateY(${offsetY}px)`
      } else if (type === 'resize-start') {
        el.style.top = `${originalTop + offsetY}px`
        el.style.height = `${Math.max(30, originalHeight - offsetY)}px`
      } else if (type === 'resize-end') {
        el.style.height = `${Math.max(30, originalHeight + offsetY)}px`
      }
    },
    onEnd: (totalOffsetY, moved) => {
      // 清除拖拽样式
      el.style.transform = ''
      
      // 没有移动 = 点击操作
      if (!moved) {
        taskStore.openEditPanel(props.task)
        return
      }
      
      const deltaMinutes = offsetToMinutes(totalOffsetY)
      
      // 有移动且时间变化 = 更新任务
      if (deltaMinutes !== 0) {
        if (type === 'move') {
          const duration = calculateDuration(props.task.startTime, props.task.endTime)
          const newStart = offsetTime(props.task.startTime, deltaMinutes)
          const newEnd = offsetTime(props.task.startTime, deltaMinutes + duration)
          
          taskStore.updateTask({
            id: props.task.id,
            startTime: newStart,
            endTime: newEnd,
          })
        } else if (type === 'resize-start') {
          const newStart = offsetTime(props.task.startTime, deltaMinutes)
          taskStore.updateTask({
            id: props.task.id,
            startTime: newStart,
          })
        } else if (type === 'resize-end') {
          const newEnd = offsetTime(props.task.endTime, deltaMinutes)
          taskStore.updateTask({
            id: props.task.id,
            endTime: newEnd,
          })
        }
      }
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
      colorStyle.bg,
      colorStyle.border,
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
    @pointerdown="(e) => handlePointerDown(e, 'move')"
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
