<script setup lang="ts">
import { computed } from 'vue'
import { useDragStore } from '@/stores/drag'
import { TASK_COLORS } from '@/utils/constants'
import type { TaskColorStyle } from '@/types'

const dragStore = useDragStore()

// 是否显示预览
const showPreview = computed(() => {
  const result = dragStore.isDragging && dragStore.isFreeDrag && dragStore.draggingTask
  console.log('DragPreview showPreview', {
    isDragging: dragStore.isDragging,
    isFreeDrag: dragStore.isFreeDrag,
    isDraggingFromList: dragStore.isDraggingFromList,
    dragMode: dragStore.dragMode,
    hasDraggingTask: !!dragStore.draggingTask,
    result
  })
  return result
})

// 预览位置
const previewStyle = computed(() => {
  if (!showPreview.value) return {}
  
  // 向下偏移16px，露出虚线提示
  const DRAG_OFFSET_Y = 16
  
  return {
    left: `${dragStore.currentPosition.x}px`,
    top: `${dragStore.currentPosition.y + DRAG_OFFSET_Y}px`,
    transform: 'translate(-50%, -50%)',
  }
})

// 预设颜色
const presetColors = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

// 判断是否为自定义颜色
const isCustomColor = computed(() => {
  return dragStore.draggingTask && !presetColors.includes(dragStore.draggingTask.color)
})

// 任务颜色样式
const colorStyle = computed((): TaskColorStyle => {
  if (!dragStore.draggingTask) return { bg: '', border: '', text: '', customBg: '', customBorder: '' }
  
  if (isCustomColor.value) {
    return {
      bg: '',
      border: '',
      text: '',
      customBg: dragStore.draggingTask.color,
      customBorder: dragStore.draggingTask.color,
    }
  }
  
  return { ...TASK_COLORS[dragStore.draggingTask.color as keyof typeof TASK_COLORS], customBg: '', customBorder: '' }
})

// 任务信息
const taskTitle = computed(() => dragStore.draggingTask?.title || '')
const taskTime = computed(() => {
  if (!dragStore.draggingStartTime || !dragStore.draggingEndTime) return ''
  return `${dragStore.draggingStartTime} - ${dragStore.draggingEndTime}`
})
</script>

<template>
  <div
    v-if="showPreview"
    :style="previewStyle"
    :class="[
      'fixed z-[9999] pointer-events-none',
      'w-[180px] h-[60px]',
      'rounded-2xl overflow-hidden',
      'drag-preview-card'
    ]"
  >
      <!-- 磨砂玻璃背景 -->
      <div
        :class="[
          'absolute inset-0 backdrop-blur-xl',
          !isCustomColor && colorStyle.bg,
          'opacity-95'
        ]"
        :style="isCustomColor ? {
          backgroundColor: `${colorStyle.customBg}20`
        } : undefined"
      />
      
      <!-- 边框 -->
      <div
        :class="[
          'absolute inset-0 border-l-4 rounded-2xl',
          !isCustomColor && colorStyle.border
        ]"
        :style="isCustomColor ? {
          borderLeftColor: colorStyle.customBorder
        } : undefined"
      />
      
      <!-- 内容 -->
      <div class="relative h-full flex flex-col justify-center px-3 py-2">
        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {{ taskTitle }}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
          {{ taskTime }}
        </div>
      </div>
      
      <!-- 微光效果 -->
      <div class="absolute inset-0 shimmer-effect opacity-30" />
    </div>
</template>

<style scoped>
.drag-preview-card {
  box-shadow: 
    0 12px 32px rgba(0, 82, 217, 0.35),
    0 4px 12px rgba(0, 0, 0, 0.1);
  will-change: transform, left, top;
}

/* 微光效果 */
.shimmer-effect {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
