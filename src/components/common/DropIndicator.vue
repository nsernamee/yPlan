<script setup lang="ts">
import { computed } from 'vue'
import { HOUR_HEIGHT, HEADER_HEIGHT, LIST_DRAG_OFFSET, TIME_START_HOUR, TIME_END_HOUR } from '@/utils/constants'
import { timeToPixels } from '@/utils/time'
import { useDragStore } from '@/stores/drag'

const dragStore = useDragStore()

const props = defineProps<{
  time: string           // 目标时间 "HH:mm"
  duration?: number      // 持续时间（分钟），可选（保留接口但不使用）
  dateIndex?: number     // 周视图日期索引，可选（保留接口但不使用）
  includeHeader?: boolean // 是否包含头部高度偏移（日视图需要，周视图不需要）
}>()

// 从列表拖入时，预览块有 16px 下偏移 + 居中定位(高60px→上下各30px)
// 需要向上偏移约 40px 使虚线显示在预览块上方（与日历上拖动效果一致）
// 偏移对应的分钟数
const offsetMinutes = Math.round(LIST_DRAG_OFFSET / (HOUR_HEIGHT / 60))

// 计算指示器 Y 位置（相对于时间网格）
const yPosition = computed(() => {
  // 使用 timeToPixels 统一基于 TIME_START_HOUR 的像素映射
  let position = timeToPixels(props.time)
  // 从列表拖入时向上偏移
  if (dragStore.isDraggingFromList) {
    position -= LIST_DRAG_OFFSET
  }
  return props.includeHeader ? HEADER_HEIGHT + position : position
})

// 气泡显示的时间（虚线实际位置对应的日历时间）
const displayTime = computed(() => {
  if (!dragStore.isDraggingFromList) return props.time
  
  const [hour, min] = props.time.split(':').map(Number)
  const totalMinutes = hour * 60 + min - offsetMinutes
  // 边界保护：基于新的时间轴范围 [06:00, 23:59]
  const clampedMinutes = Math.max(TIME_START_HOUR * 60, Math.min(TIME_END_HOUR * 60 + 59, totalMinutes))
  const h = Math.floor(clampedMinutes / 60)
  const m = clampedMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
})
</script>

<template>
  <div
    class="absolute left-0 right-0 pointer-events-none z-20"
    :style="{ top: `${yPosition}px` }"
  >
    <!-- 虚线横线 -->
    <div class="h-0.5 border-t-2 border-dashed border-primary opacity-60" />
    
    <!-- 时间提示气泡 -->
    <div
      class="absolute left-2 -top-6 px-2 py-1 rounded-lg text-xs font-semibold text-white bg-primary shadow-lg whitespace-nowrap animate-scale-in"
    >
      {{ displayTime }}
    </div>
  </div>
</template>
