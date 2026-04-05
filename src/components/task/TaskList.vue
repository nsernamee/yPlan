<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useDragStore } from '@/stores/drag'
import type { Task } from '@/types'

const taskStore = useTaskStore()
const dragStore = useDragStore()

// 所有任务（按创建时间倒序）
const allTasks = computed(() => {
  return [...taskStore.tasks].sort((a, b) => b.createdAt - a.createdAt)
})

// 预设颜色
const presetColors = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

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
}

// 开始拖拽任务（桌面端）
function handleDragStart(task: Task, event: DragEvent) {
  if (!event.dataTransfer) return
  
  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', task.id)
  event.dataTransfer.effectAllowed = 'move'
  
  // 隐藏浏览器原生拖拽图像（避免双气泡）
  event.dataTransfer.setDragImage(new Image(), 0, 0)
  
  // 关闭可能打开的编辑面板
  taskStore.closePanel()
  
  // 设置拖拽状态，传递初始位置
  const position = { x: event.clientX, y: event.clientY }
  dragStore.startDragFromList(task, position)
  
  // 启动 RAF 轮询更新位置
  currentMousePos.value = position
  startPolling()
}

// 拖拽结束后停止轮询并清除拖拽状态（包括取消拖动的情况）
function handleDragEnd() {
  stopPolling()
  dragStore.endDrag()
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

// 全局拖拽位置更新（更新 RAF 轮询的鼠标位置）
function handleGlobalDragOver(event: DragEvent) {
  currentMousePos.value = { x: event.clientX, y: event.clientY }
}

// 组件挂载时添加全局监听
onMounted(() => {
  document.addEventListener('dragover', handleGlobalDragOver)
})

// 组件卸载时移除全局监听
onUnmounted(() => {
  document.removeEventListener('dragover', handleGlobalDragOver)
  stopPolling()
})


</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
    <!-- 头部 -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">任务列表</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">共 {{ allTasks.length }} 个任务</p>
    </div>

    <!-- 任务列表 -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div
        v-for="task in allTasks"
        :key="task.id"
        draggable="true"
        @dragstart="handleDragStart(task, $event)"
        @dragend="handleDragEnd"
        @click="handleTaskClick(task)"
        class="group relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md"
        :class="[
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'hover:border-gray-300 dark:hover:border-gray-600',
          'hover:scale-[1.02]'
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
        class="text-center py-12"
      >
        <p class="text-gray-400 dark:text-gray-600 text-sm">暂无任务</p>
        <p class="text-gray-400 dark:text-gray-600 text-xs mt-1">点击顶部按钮创建任务</p>
      </div>
    </div>
  </div>
</template>
