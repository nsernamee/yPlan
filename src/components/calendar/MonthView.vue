<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { TASK_COLORS } from '@/types'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const viewStore = useViewStore()

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
        v-for="day in monthGrid"
        :key="day.dateStr"
        @click="handleDateClick(day.dateStr)"
        :class="[
          'border-b border-r border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors',
          { 'bg-gray-50/50': !day.isCurrentMonth }
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
            :class="[
              'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer',
              TASK_COLORS[task.color].bg,
              TASK_COLORS[task.color].text
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
