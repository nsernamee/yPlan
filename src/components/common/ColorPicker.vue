<script setup lang="ts">
import { ref, watch, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import type { TaskColor } from '@/types'
import { hexToHsl, hslToHex, hslToRgb, rgbToHex } from '@/utils/color'

const props = defineProps<{
  modelValue: TaskColor
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaskColor]
}>()

// ==================== 预设颜色 ====================
const presetColors: { color: TaskColor; hex: string; label: string }[] = [
  { color: 'blue', hex: '#618DFF', label: '蓝' },
  { color: 'green', hex: '#2BA47D', label: '绿' },
  { color: 'orange', hex: '#ED7B2F', label: '橙' },
  { color: 'red', hex: '#E34D59', label: '红' },
  { color: 'purple', hex: '#9F6FFF', label: '紫' },
  { color: 'gray', hex: '#6B7280', label: '灰' },
]

const isPresetColor = computed(() => {
  return presetColors.some(p => p.color === props.modelValue)
})

function selectPreset(color: TaskColor) {
  emit('update:modelValue', color)
  // 选预设色时也同步内部 HSL 状态
  const preset = presetColors.find(p => p.color === color)
  if (preset) {
    const hsl = hexToHsl(preset.hex)
    picker.h = hsl.h
    picker.s = hsl.s
    picker.l = hsl.l
  }
}

// ==================== 自建颜色选择器状态 ====================
const expanded = ref(false)

// 当前选择的 HSL 值
const picker = reactive({
  h: 220,
  s: 56,
  l: 68,
})

// 面板内指示器位置 (0-1)
const pointer = reactive({ x: 0, y: 0 })

// 色相条指示器位置 (0-1)
const huePointer = ref(0)

// 从当前 modelValue 初始化 picker
function initPickerFromValue(val: string) {
  try {
    const hsl = hexToHsl(val)
    picker.h = hsl.h
    picker.s = hsl.s
    picker.l = hsl.l
    pointer.x = hsl.s / 100
    pointer.y = hsl.l / 100
    huePointer.value = hsl.h / 360
  } catch {
    // fallback
  }
}

watch(() => props.modelValue, (val) => {
  if (!isPresetColor.value && typeof val === 'string') {
    initPickerFromValue(val)
  }
}, { immediate: true })

// 当前颜色（hex）
const currentHex = computed(() => hslToHex(picker.h, picker.s, picker.l))

// 面板背景渐变色（当前色相的饱和度×亮度映射）
const panelGradient = computed(() => {
  // 白 → 当前色相(全饱和) → 黑
  const pureColor = hslToHex(picker.h, 100, 50)
  return `linear-gradient(to bottom, transparent, black), linear-gradient(to right, #fff, ${pureColor})`
})

// 色相条渐变
const hueGradient = computed(() =>
  `linear-gradient(to right,
    #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%,
    #0000ff 67%, #ff00f5 83%, #ff0000 100%)`
)

// ==================== 交互：展开/收起 ====================
function toggleExpanded() {
  expanded.value = !expanded.value
}

// 点击外部收起
const containerRef = ref<HTMLElement>()
function handleOutsideClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    expanded.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})

// ==================== 拖拽：饱和度/亮度面板 ====================
let draggingPanel = false

function getPanelPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const el = panelRef.value!
  const rect = el.getBoundingClientRect()
  let clientX: number, clientY: number

  if ('touches' in e) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
  }
}

function onPanelStart(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  draggingPanel = true
  onPanelMove(e)
}

function onPanelMove(e: MouseEvent | TouchEvent) {
  if (!draggingPanel) return
  e.preventDefault()
  const pos = getPanelPosition(e)
  pointer.x = pos.x
  pointer.y = pos.y
  picker.s = Math.round(pos.x * 100)
  picker.l = Math.round(pos.y * 100)
  emitCustomColor()
}

function onPanelEnd() {
  draggingPanel = false
}

const panelRef = ref<HTMLElement>()

// ==================== 拖拽：色相滑条 ====================
let draggingHue = false

function getHuePosition(e: MouseEvent | TouchEvent): number {
  const el = hueBarRef.value!
  const rect = el.getBoundingClientRect()
  let clientX: number
  if ('touches' in e) {
    clientX = e.touches[0].clientX
  } else {
    clientX = e.clientX
  }
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

function onHueStart(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  draggingHue = true
  onHueMove(e)
}

function onHueMove(e: MouseEvent | TouchEvent) {
  if (!draggingHue) return
  e.preventDefault()
  const pos = getHuePosition(e)
  huePointer.value = pos
  picker.h = Math.round(pos * 360)
  emitCustomColor()
}

function onHueEnd() {
  draggingHue = false
}

const hueBarRef = ref<HTMLElement>()

// 全局 mousemove/up（支持拖出元素范围仍继续）
function onGlobalMove(e: MouseEvent) {
  if (draggingPanel) {
    const pos = getPanelPosition(e)
    pointer.x = pos.x
    pointer.y = pos.y
    picker.s = Math.round(pos.x * 100)
    picker.l = Math.round(pos.y * 100)
    emitCustomColor()
  }
  if (draggingHue) {
    const pos = getHuePosition(e)
    huePointer.value = pos
    picker.h = Math.round(pos * 360)
    emitCustomColor()
  }
}

function onGlobalEnd() {
  draggingPanel = false
  draggingHue = false
}

onMounted(() => {
  window.addEventListener('mousemove', onGlobalMove)
  window.addEventListener('mouseup', onGlobalEnd)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onGlobalMove)
  window.removeEventListener('mouseup', onGlobalEnd)
})

// ==================== 输出 ====================
function emitCustomColor() {
  emit('update:modelValue', currentHex.value)
}
</script>

<template>
  <div ref="containerRef" class="color-picker">
    <!-- 标签 -->
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">颜色标签</label>

    <!-- 预设颜色行 -->
    <div class="flex items-center gap-2.5">
      <button
        v-for="preset in presetColors"
        :key="preset.color"
        @click="selectPreset(preset.color)"
        :class="[
          'w-8 h-8 rounded-full transition-all duration-200 flex-shrink-0',
          'active:scale-95',
          modelValue === preset.color
            ? 'ring-2 ring-primary scale-110 shadow-md'
            : ''
        ]"
        :style="{ backgroundColor: preset.hex }"
        :title="preset.label"
      />

      <!-- 分隔 -->
      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />

      <!-- 自定义颜色按钮 -->
      <button
        @click="toggleExpanded"
        :class="[
          'w-8 h-8 rounded-full transition-all duration-200 flex-shrink-0 relative overflow-hidden',
          'active:scale-95',
          !isPresetColor && !expanded
            ? 'ring-2 ring-primary scale-105 shadow-md'
            : '',
          expanded ? 'ring-2 ring-primary shadow-md' : ''
        ]"
        :style="{ backgroundColor: currentHex }"
        title="自定义颜色"
      >
        <!-- 小画笔图标 -->
        <svg v-if="!expanded || isPresetColor" class="w-3.5 h-3.5 absolute inset-0 m-auto drop-shadow-md" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4))">
          <path d="M3 21l2-2 14-14 2 2L7 19l-4 2zm16-16l-2-2 2-2 2 2-2 2z"/>
        </svg>
      </button>
    </div>

    <!-- 展开的自建颜色选择面板 -->
    <Transition name="picker-expand">
      <div v-if="expanded" class="mt-3 p-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60">
        <!-- 饱和度/亮度 2D 面板 -->
        <div
          ref="panelRef"
          class="relative w-full aspect-square rounded-xl cursor-crosshair touch-none overflow-hidden select-none"
          :style="{ background: panelGradient }"
          @mousedown="onPanelStart"
          @touchstart.prevent="onPanelStart"
          @touchmove.prevent="onPanelMove"
          @touchend="onPanelEnd"
        >
          <!-- 圆形指示器 -->
          <div
            class="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow-lg pointer-events-none transition-none"
            :style="{
              left: `${pointer.x * 100}%`,
              top: `${pointer.y * 100}%`,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.1)',
            }"
          />
        </div>

        <!-- 色相滑条 -->
        <div class="mt-3">
          <div
            ref="hueBarRef"
            class="relative w-full h-4 rounded-full cursor-pointer touch-none select-none"
            :style="{ background: hueGradient }"
            @mousedown="onHueStart"
            @touchstart.prevent="onHueStart"
            @touchmove.prevent="onHueMove"
            @touchend="onHueEnd"
          >
            <!-- 色相指示器 -->
            <div
              class="absolute top-1/2 -translate-y-1/2 w-5 h-5 -ml-2.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              :style="{
                left: `${huePointer * 100}%`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }"
            />
          </div>
        </div>

        <!-- 当前颜色预览 + HEX值 -->
        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-lg shadow-inner border border-gray-200 dark:border-gray-600"
              :style="{ backgroundColor: currentHex }"
            />
            <span class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">{{ currentHex }}</span>
          </div>
          <button
            v-if="!isPresetColor"
            @click="selectPreset(currentHex as TaskColor)"
            class="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 active:scale-95 transition-colors"
          >
            应用
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.picker-expand-enter-active,
.picker-expand-leave-active {
  transition: all 0.25s ease-out;
  transform-origin: top;
}
.picker-expand-enter-from,
.picker-expand-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-8px);
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .color-picker button {
    /* 触摸时不显示 hover 效果 */
  }
}
</style>
