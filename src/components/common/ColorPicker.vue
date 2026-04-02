<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { TaskColor } from '@/types'

const props = defineProps<{
  modelValue: TaskColor
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaskColor]
}>()

// 预设颜色
const presetColors: { color: TaskColor; hex: string }[] = [
  { color: 'blue', hex: '#618DFF' },
  { color: 'green', hex: '#2BA47D' },
  { color: 'orange', hex: '#ED7B2F' },
  { color: 'red', hex: '#E34D59' },
  { color: 'purple', hex: '#9F6FFF' },
  { color: 'gray', hex: '#6B7280' },
]

// 判断是否为自定义颜色
const isCustomColor = computed(() => {
  return !presetColors.some(p => p.color === props.modelValue)
})

// 自定义颜色值
const customColor = ref('#618DFF')

// 监听 modelValue 变化，同步自定义颜色
watch(() => props.modelValue, (newColor) => {
  if (isCustomColor.value) {
    customColor.value = newColor
  }
}, { immediate: true })

// 当前显示的颜色（用于自定义颜色预览）
const currentDisplayColor = computed(() => {
  if (isCustomColor.value) {
    return props.modelValue
  }
  const preset = presetColors.find(p => p.color === props.modelValue)
  return preset?.hex || '#618DFF'
})

function selectPresetColor(color: TaskColor) {
  emit('update:modelValue', color)
}

function handleCustomColorChange(event: Event) {
  const target = event.target as HTMLInputElement
  customColor.value = target.value
  emit('update:modelValue', customColor.value)
}

function handleCustomColorClick() {
  // 如果当前是自定义颜色，继续编辑；否则从当前颜色开始
  if (!isCustomColor.value) {
    customColor.value = currentDisplayColor.value
  }
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">颜色标签</label>
    <div class="flex items-center gap-3">
      <!-- 预设颜色 -->
      <button
        v-for="preset in presetColors"
        :key="preset.color"
        @click="selectPresetColor(preset.color)"
        :class="[
          'w-8 h-8 rounded-full transition-all duration-200',
          'hover:scale-110 hover:shadow-lg',
          modelValue === preset.color
            ? 'ring-2 ring-offset-2 ring-primary scale-110 shadow-md'
            : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300 dark:hover:ring-gray-600'
        ]"
        :style="{ backgroundColor: preset.hex }"
        :title="preset.color"
      />

      <!-- 分隔线 -->
      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <!-- 自定义颜色选择器 -->
      <div class="relative">
        <button
          @click="handleCustomColorClick"
          :class="[
            'w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center overflow-hidden',
            'hover:scale-110 hover:shadow-lg',
            isCustomColor
              ? 'ring-2 ring-offset-2 ring-primary scale-110 shadow-md'
              : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300 dark:hover:ring-gray-600'
          ]"
          :style="{ backgroundColor: currentDisplayColor }"
          title="自定义颜色"
        >
          <span class="text-white text-xs font-bold drop-shadow-md">✎</span>
        </button>
        
        <!-- 隐藏的颜色输入 -->
        <input
          type="color"
          :value="customColor"
          @input="handleCustomColorChange"
          @click="handleCustomColorClick"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  </div>
</template>
