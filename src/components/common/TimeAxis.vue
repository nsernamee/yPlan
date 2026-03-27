<script setup lang="ts">
import { computed } from 'vue'
import { HOUR_HEIGHT, HEADER_HEIGHT } from '@/utils/constants'

// 时间刻度（00:00 - 23:00）
const timeSlots = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  label: `${i.toString().padStart(2, '0')}:00`,
}))

defineProps<{
  showHeader?: boolean
}>()

defineExpose({
  HOUR_HEIGHT,
  HEADER_HEIGHT,
})
</script>

<template>
  <div class="w-16 flex-shrink-0 border-r border-gray-200">
    <!-- 顶部空白 -->
    <div v-if="showHeader" :style="{ height: `${HEADER_HEIGHT}px` }" class="border-b border-gray-200" />
    
    <!-- 时间刻度 -->
    <div
      v-for="slot in timeSlots"
      :key="slot.hour"
      :style="{ height: `${HOUR_HEIGHT}px` }"
      class="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500"
    >
      {{ slot.label }}
    </div>
  </div>
</template>
