<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useDragStore } from '@/stores/drag'
import type { Task } from '@/types'
import { isPlannedTask } from '@/types'
import { Plus } from 'lucide-vue-next'

const taskStore = useTaskStore()
const dragStore = useDragStore()

// 所有任务（按创建时间倒序）
const allTasks = computed(() => {
  return [...taskStore.tasks].sort((a, b) => b.createdAt - a.createdAt)
})

// 预设颜色
const presetColors = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

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

// 点击任务
function handleTaskClick(task: Task) {
  taskStore.openEditPanel(task)
}

// 开始拖拽任务
function handleDragStart(task: Task, event: DragEvent) {
  if (!event.dataTransfer) return
  
  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', task.id)
  event.dataTransfer.effectAllowed = 'move'
  
  // 设置拖拽状态
  dragStore.startDragFromList(task)
}

// 新建任务
function handleCreateTask() {
  taskStore.openCreatePanelForList()
}
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
                v-if="!isPlannedTask(task)"
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
        <p class="text-gray-400 dark:text-gray-600 text-xs mt-1">点击下方按钮创建任务</p>
      </div>
    </div>

    <!-- 底部新建按钮 -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800">
      <button
        @click="handleCreateTask"
        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light transition-all duration-200 btn-apple"
      >
        <Plus class="w-4 h-4" />
        <span class="text-sm font-medium">新建任务</span>
      </button>
    </div>
  </div>
</template>
