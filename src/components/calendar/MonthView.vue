<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { useDragStore } from '@/stores/drag'
import { TASK_COLORS } from '@/types'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const viewStore = useViewStore()
const dragStore = useDragStore()

// 月视图网格（6行 x 7列）
const monthGrid = computed(() => {
  const start = dayjs(viewStore.currentDate).startOf('month').startOf('week')
  const end = dayjs(viewStore.currentDate).endOf('month').endOf('week')
  const days = []
  
  let current = start
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    days.push({
      date: current.toDate(),
      dateStr: current.format('YYYY-MM-DD'),
      dayNum: current.date(),
      isCurrentMonth: current.month() === dayjs(viewStore.currentDate).month(),
      isToday: current.isSame(dayjs(), 'day'),
    })
    current = current.add(1, 'day')
  }
  
  return days
})

// 星期标题
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 目标日期索引
const targetDateIndex = ref<number | null>(null)

// 获取某天的任务
function getTasksForDate(dateStr: string) {
  return taskStore.getTasksByDateRange(dateStr, dateStr)
}

// 点击日期
function handleDateClick(dateStr: string) {
  viewStore.setDate(dateStr)
  viewStore.setViewType('day')
}

// 点击任务
function handleTaskClick(task: typeof taskStore.tasks[0], event: Event) {
  event.stopPropagation()
  taskStore.openEditPanel(task)
}

// 任务拖拽开始
function handleTaskDragStart(task: typeof taskStore.tasks[0], event: PointerEvent) {
  event.stopPropagation()
  
  // 初始化拖拽
  dragStore.startDrag({
    task,
    type: 'move',
    mode: 'free',
    startPosition: { x: event.clientX, y: event.clientY },
  })
  
  // 添加全局监听
  document.addEventListener('pointermove', handleGlobalDragMove)
  document.addEventListener('pointerup', handleGlobalDragEnd)
}

// 全局拖拽移动
function handleGlobalDragMove(e: PointerEvent) {
  if (!dragStore.isDragging) return
  
  dragStore.updatePosition({ x: e.clientX, y: e.clientY })
  
  // 检测目标日期单元格
  const cells = document.querySelectorAll('.month-cell')
  cells.forEach((cell, index) => {
    const rect = cell.getBoundingClientRect()
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      targetDateIndex.value = index
      dragStore.setTargetDate(monthGrid.value[index].dateStr)
    }
  })
}

// 全局拖拽结束
function handleGlobalDragEnd() {
  // 如果有目标日期，移动任务
  if (targetDateIndex.value !== null && dragStore.draggingTask) {
    const targetDate = monthGrid.value[targetDateIndex.value].dateStr
    const task = dragStore.draggingTask
    
    // 更新任务日期（保留原时间）
    taskStore.updateTask({
      id: task.id,
      startDate: targetDate,
      endDate: targetDate,
    })
  }
  
  // 清理
  dragStore.endDrag()
  targetDateIndex.value = null
  
  document.removeEventListener('pointermove', handleGlobalDragMove)
  document.removeEventListener('pointerup', handleGlobalDragEnd)
}

// 清理
onUnmounted(() => {
  document.removeEventListener('pointermove', handleGlobalDragMove)
  document.removeEventListener('pointerup', handleGlobalDragEnd)
})
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 星期标题 -->
    <div class="grid grid-cols-7 border-b border-gray-200 bg-white">
      <div
        v-for="day in weekDays"
        :key="day"
        class="py-2 text-center text-sm font-medium text-gray-500"
      >
        {{ day }}
      </div>
    </div>
    
    <!-- 日期网格 -->
    <div class="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
      <div
        v-for="(day, index) in monthGrid"
        :key="day.dateStr"
        @click="handleDateClick(day.dateStr)"
        :class="[
          'border-b border-r border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors month-cell',
          { 'bg-gray-50/50': !day.isCurrentMonth },
          { 'drop-target-highlight': targetDateIndex === index }
        ]"
      >
        <!-- 日期数字 -->
        <div
          :class="[
            'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
            day.isToday ? 'bg-primary text-white' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          ]"
        >
          {{ day.dayNum }}
        </div>
        
        <!-- 任务列表 -->
        <div class="space-y-0.5">
          <div
            v-for="task in getTasksForDate(day.dateStr).slice(0, 3)"
            :key="task.id"
            @click="handleTaskClick(task, $event)"
            @pointerdown="handleTaskDragStart(task, $event)"
            :class="[
              'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer select-none',
              TASK_COLORS[task.color].bg,
              TASK_COLORS[task.color].text,
              'hover:opacity-80 active:opacity-60'
            ]"
          >
            {{ task.title }}
          </div>
          <div
            v-if="getTasksForDate(day.dateStr).length > 3"
            class="text-xs text-gray-500 px-1.5"
          >
            +{{ getTasksForDate(day.dateStr).length - 3 }} 更多
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
