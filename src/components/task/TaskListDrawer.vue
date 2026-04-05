<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useDragStore } from '@/stores/drag'
import type { Task } from '@/types'
import { X } from 'lucide-vue-next'
import { HOUR_HEIGHT, HEADER_HEIGHT } from '@/utils/constants'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const taskStore = useTaskStore()
const dragStore = useDragStore()

// 检测是否触摸设备（触摸设备上禁用 HTML5 DnD，避免 ghost image 双重气泡）
const isTouchDevice = 'ontouchstart' in window

// 所有任务（按创建时间倒序）
const allTasks = computed(() => {
  return [...taskStore.tasks].sort((a, b) => b.createdAt - a.createdAt)
})

// 预设颜色
const presetColors = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

// 触摸长按计时器
const longPressTimer = ref<number | null>(null)
const LONG_PRESS_DURATION = 500 // 500ms 长按触发拖拽

// 是否正在触摸拖拽（用于遮罩层穿透）
const isTouchDragging = ref(false)

// RAF 轮询 ID（用于桌面端动画流畅更新）
const rafId = ref<number | null>(null)

// 当前鼠标位置（用于 RAF 轮询）
const currentMousePos = ref({ x: 0, y: 0 })

// 获取任务颜色
function getTaskColor(task: Task): string {
  const isCustomColor = !presetColors.includes(task.color)
  if (isCustomColor) {
    return task.color
  }
  
  const colorMap: Record<string, string> = {
    blue: '#618DFF',
    green: '#2BA47D',
    orange: '#ED7B2F',
    red: '#E34D59',
    purple: '#9F6FFF',
    gray: '#6B7280',
  }
  
  return colorMap[task.color] || '#6B7280'
}

// 点击任务（只编辑任务属性，不传 schedule）
function handleTaskClick(task: Task) {
  taskStore.openEditPanel(task)
  emit('close')
}

// 开始拖拽任务（桌面端）
function handleDragStart(task: Task, event: DragEvent) {
  if (!event.dataTransfer) return
  
  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', task.id)
  event.dataTransfer.effectAllowed = 'move'
  
  // 关闭可能打开的编辑面板
  taskStore.closePanel()
  
  // 设置拖拽状态，传递初始位置
  const position = { x: event.clientX, y: event.clientY }
  dragStore.startDragFromList(task, position)
  
  // 启动 RAF 轮询更新位置
  currentMousePos.value = position
  startPolling()
}

// 拖拽结束后关闭窗口（延迟确保拖拽完成）
function handleDragEnd() {
  // 停止 RAF 轮询
  stopPolling()
  
  setTimeout(() => {
    emit('close')
  }, 100)
}

// RAF 轮询更新鼠标位置（确保动画流畅）
function pollMousePosition() {
  if (dragStore.isDraggingFromList) {
    dragStore.updatePosition(currentMousePos.value)
    rafId.value = requestAnimationFrame(pollMousePosition)
  }
}

// 启动轮询
function startPolling() {
  if (rafId.value === null) {
    rafId.value = requestAnimationFrame(pollMousePosition)
  }
}

// 停止轮询
function stopPolling() {
  if (rafId.value !== null) {
    cancelAnimationFrame(rafId.value)
    rafId.value = null
  }
}

// 点击遮罩关闭
function handleMaskClick() {
  emit('close')
}

// 全局拖拽位置更新（更新 RAF 轮询的鼠标位置）
function handleGlobalDragOver(event: DragEvent) {
  currentMousePos.value = { x: event.clientX, y: event.clientY }
}

// ============ 移动端触摸事件支持 ============

// 触摸拖拽时的目标区域类型（在 touchmove 中实时追踪，touchEnd 时直接使用，避免 elementFromPoint 被遮罩层拦截）
type DropTargetType = 'day-column' | 'task-area' | 'month-cell' | null
const currentDropTarget = ref<DropTargetType>(null)
const lastMonthGridEl = ref<HTMLElement | null>(null)  // 月视图网格元素引用

// 触摸开始
function handleTouchStart(task: Task, event: TouchEvent) {
  const touch = event.touches[0]
  const position = { x: touch.clientX, y: touch.clientY }
  
  // 清除之前的计时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
  
  // 开始长按计时
  longPressTimer.value = window.setTimeout(() => {
    // 长按触发拖拽
    dragStore.startDragFromList(task, position)
    isTouchDragging.value = true  // 拖拽开始，遮罩层穿透
    emit('close')  // 立即关闭任务列表
  }, LONG_PRESS_DURATION)
}

// 触摸移动
function handleTouchMove(event: TouchEvent) {
  if (!dragStore.isDraggingFromList) {
    // 如果还没开始拖拽，移动距离超过阈值则取消长按
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
    return
  }
  
  // 阻止页面滚动
  event.preventDefault()
  
  // 更新拖拽位置
  const touch = event.touches[0]
  dragStore.updatePosition({ x: touch.clientX, y: touch.clientY })
  
  // 查找触摸位置下的放置目标并计算目标时间/日期
  const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
  const dayColumn = dropTarget?.closest('.day-column') as HTMLElement
  const taskArea = dropTarget?.closest('.task-area') as HTMLElement
  const monthCell = dropTarget?.closest('.month-cell') as HTMLElement
  
  // 实时追踪当前有效的目标区域（供 touchEnd 使用）
  const monthGridEl = dropTarget?.closest('.month-grid') as HTMLElement | null
  
  if (dayColumn) {
    currentDropTarget.value = 'day-column'
    lastMonthGridEl.value = null
    
    // 周视图：计算时间和日期索引
    const rect = dayColumn.getBoundingClientRect()
    const y = touch.clientY - rect.top
    const hour = Math.max(0, Math.min(23, Math.floor(y / HOUR_HEIGHT)))
    const minutes = Math.floor((y % HOUR_HEIGHT) / (HOUR_HEIGHT / 60))
    
    dragStore.setTargetTime(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0').substring(0, 2)}`)
    
    // 查找日期索引
    const columns = document.querySelectorAll('.day-column')
    columns.forEach((col, index) => {
      if (col === dayColumn) {
        dragStore.setTargetDate(getDateStrFromIndex(index))
      }
    })
  } else if (taskArea) {
    currentDropTarget.value = 'task-area'
    lastMonthGridEl.value = null
    
    // 日视图：只计算时间
    const rect = taskArea.getBoundingClientRect()
    const scrollTop = taskArea.scrollTop || 0
    const y = touch.clientY - rect.top + scrollTop - HEADER_HEIGHT
    const hour = Math.max(0, Math.min(23, Math.floor(y / HOUR_HEIGHT)))
    const minutes = Math.floor((y % HOUR_HEIGHT) / (HOUR_HEIGHT / 60))
    
    dragStore.setTargetTime(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0').substring(0, 2)}`)
  } else if (monthCell || monthGridEl) {
    // 月视图：优先用 month-cell 精确定位，回退到 month-grid
    currentDropTarget.value = 'month-cell'
    lastMonthGridEl.value = monthGridEl || (monthCell?.closest('.month-grid') as HTMLElement | null)
    
    if (monthCell) {
      const dateStr = (monthCell as any).dataset?.date || null
      dragStore.setTargetDate(dateStr)
    }
  } else {
    // 不在有效目标上，清除追踪状态和指示
    currentDropTarget.value = null
    lastMonthGridEl.value = null
    dragStore.setTargetTime(null)
    dragStore.setTargetDate(null)
  }
}

// 根据索引获取日期字符串（周视图）
function getDateStrFromIndex(index: number): string | null {
  const columns = document.querySelectorAll('.day-column')
  if (index >= 0 && index < columns.length) {
    const column = columns[index] as HTMLElement
    // 从 dataset 或其他方式获取日期，这里简化处理
    // 实际应该从 weekDays 获取
    return null // 需要实际实现
  }
  return null
}

// 触摸结束（使用 touchmove 中追踪的目标，避免 elementFromPoint 被遮罩层拦截）
function handleTouchEnd(event: TouchEvent) {
  // 清除长按计时器
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  if (!dragStore.isDraggingFromList) return
  
  // 使用 touchmove 过程中追踪到的最后一个有效目标
  const touch = event.changedTouches[0]
  
  if (currentDropTarget.value === 'day-column') {
    // 周视图：查找当前触摸位置下的 day-column
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayColumn = dropTarget?.closest('.day-column')
    if (dayColumn) {
      const dropEvent = new CustomEvent('custom-drop', {
        detail: { x: touch.clientX, y: touch.clientY, task: dragStore.draggingTask }
      })
      dayColumn.dispatchEvent(dropEvent)
    }
  } else if (currentDropTarget.value === 'task-area') {
    // 日视图：查找当前触摸位置下的 task-area
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
    const taskArea = dropTarget?.closest('.task-area')
    if (taskArea) {
      const dropEvent = new CustomEvent('custom-drop', {
        detail: { x: touch.clientX, y: touch.clientY, task: dragStore.draggingTask }
      })
      taskArea.dispatchEvent(dropEvent)
    }
  } else if (currentDropTarget.value === 'month-cell' && lastMonthGridEl.value) {
    // 月视图：直接用追踪到的网格元素引用，不依赖 elementFromPoint！
    const dropEvent = new CustomEvent('custom-drop', {
      detail: { x: touch.clientX, y: touch.clientY, task: dragStore.draggingTask }
    })
    lastMonthGridEl.value.dispatchEvent(dropEvent)
  }
  // 如果 currentDropTarget 为 null，说明松手时不在有效目标上 → 不创建日程
  
  // 结束拖拽，清除状态
  currentDropTarget.value = null
  lastMonthGridEl.value = null
  isTouchDragging.value = false
  dragStore.endDrag()
  
  // 关闭窗口
  setTimeout(() => {
    emit('close')
  }, 100)
}

// 添加/移除全局事件监听
watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('dragover', handleGlobalDragOver)
  } else {
    document.removeEventListener('dragover', handleGlobalDragOver)
    stopPolling()
  }
})

onUnmounted(() => {
  document.removeEventListener('dragover', handleGlobalDragOver)
  stopPolling()
})
</script>

<template>
  <!-- 遮罩层 -->
  <Transition name="fade">
    <div
      v-if="visible"
      :class="['fixed inset-0 z-40', { 'pointer-events-none': isTouchDragging }]"
      @click="handleMaskClick"
    />
  </Transition>

  <!-- 弹出窗口 -->
  <Transition name="pop">
    <div
      v-if="visible"
      class="fixed right-4 bottom-20 w-[min(320px,calc(100vw-32px))] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col max-h-[60vh] overflow-hidden z-50"
      @click.stop
    >
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">任务列表</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">共 {{ allTasks.length }} 个任务 · 拖动到日历</p>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X class="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <!-- 任务列表（可滚动） -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        <div
          v-for="task in allTasks"
          :key="task.id"
          :draggable="!isTouchDevice"
          @dragstart="handleDragStart(task, $event)"
          @dragend="handleDragEnd"
          @click="handleTaskClick(task)"
          @touchstart="handleTouchStart(task, $event)"
          @touchmove="handleTouchMove($event)"
          @touchend="handleTouchEnd($event)"
          class="group relative p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md active:scale-[0.98]"
          :class="[
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'hover:border-gray-300 dark:hover:border-gray-600'
          ]"
        >
          <!-- 颜色标识 -->
          <div class="flex items-start gap-3">
            <div
              class="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              :style="{ backgroundColor: getTaskColor(task) }"
            />
            
            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ task.title }}
                </h3>
                
                <!-- 未计划标签 -->
                <span
                  v-if="!taskStore.isTaskScheduled(task.id)"
                  class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full whitespace-nowrap"
                >
                  未计划
                </span>
              </div>
              
              <!-- 备注预览 -->
              <p
                v-if="task.note"
                class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate"
              >
                {{ task.note }}
              </p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="allTasks.length === 0"
          class="text-center py-8"
        >
          <p class="text-gray-400 dark:text-gray-600 text-sm">暂无任务</p>
          <p class="text-gray-400 dark:text-gray-600 text-xs mt-1">点击顶部按钮创建任务</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 遮罩淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 弹出窗口缩放动画 */
.pop-enter-active {
  transition: all 0.15s ease-out;
}

.pop-leave-active {
  transition: all 0.1s ease-in;
}

.pop-enter-from {
  transform: scale(0.9);
  opacity: 0;
}

.pop-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
