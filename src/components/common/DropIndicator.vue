<script setup lang="ts">
import { computed } from 'vue'
import { HOUR_HEIGHT, HEADER_HEIGHT } from '@/utils/constants'

const props = defineProps<{
  time: string           // 目标时间 "HH:mm"
  duration?: number      // 持续时间（分钟），可选（保留接口但不使用）
  dateIndex?: number     // 周视图日期索引，可选（保留接口但不使用）
  includeHeader?: boolean // 是否包含头部高度偏移（日视图需要，周视图不需要）
}>()

// 计算指示器 Y 位置（相对于时间网格）
const yPosition = computed(() => {
  const [hour, min] = props.time.split(':').map(Number)
  const position = hour * HOUR_HEIGHT + (min / 60) * HOUR_HEIGHT
  return props.includeHeader ? HEADER_HEIGHT + position : position
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
      {{ time }}
    </div>
  </div>
</template>
