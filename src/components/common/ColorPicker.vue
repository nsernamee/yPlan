<script setup lang="ts">
import { COLOR_OPTIONS } from '@/utils/constants'
import type { TaskColor } from '@/types'

defineProps<{
  modelValue: TaskColor
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaskColor]
}>()

function selectColor(color: TaskColor) {
  emit('update:modelValue', color)
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">颜色标签</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in COLOR_OPTIONS"
        :key="option.value"
        @click="selectColor(option.value)"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
          modelValue === option.value
            ? 'ring-2 ring-offset-2'
            : 'hover:scale-105'
        ]"
        :style="{
          backgroundColor: `var(--color-task-${option.value})`,
          color: 'white',
          '--tw-ring-color': `var(--color-task-${option.value})`,
        }"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
:root {
  --color-task-blue: #618DFF;
  --color-task-green: #2BA47D;
  --color-task-orange: #ED7B2F;
  --color-task-red: #E34D59;
  --color-task-purple: #9F6FFF;
  --color-task-gray: #6B7280;
}
</style>
