<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import TaskSlider from '@/components/task/TaskSlider.vue'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const viewStore = useViewStore()

// 时间刻度
const timeSlots = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  label: `${i.toString().padStart(2, '0')}:00`,
}))

// 周日期
const weekDays = computed(() => {
  const start = dayjs(viewStore.currentDate).startOf('week')
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add(i, 'day')
    return {
      date: d.toDate(),
      dateStr: d.format('YYYY-MM-DD'),
      dayName: ['日', '一', '二', '三', '四', '五', '六'][d.day()],
      dayNum: d.date(),
      isToday: d.isSame(dayjs(), 'day'),
    }
  })
})

// 每列宽度
const HOUR_HEIGHT = 60
const HEADER_HEIGHT = 60

// 计算任务样式
function getTaskStyle(task: typeof taskStore.tasks[0]) {
  const [startHour, startMin] = task.startTime.split(':').map(Number)
  const [endHour, endMin] = task.endTime.split(':').map(Number)
  
  const top = startHour * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT
  const height = ((endHour - startHour) + (endMin - startMin) / 60) * HOUR_HEIGHT
  
  return {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
  }
}

// 获取某天的任务
function getTasksForDate(dateStr: string) {
  return taskStore.getTasksByDateRange(dateStr, dateStr)
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 日期头部 -->
    <div class="flex border-b border-gray-200 bg-white">
      <div class="w-16 flex-shrink-0 border-r border-gray-200" />
      <div
        v-for="day in weekDays"
        :key="day.dateStr"
        class="flex-1 min-w-[80px] border-r border-gray-200 last:border-r-0 py-2 text-center"
      >
        <div class="text-xs text-gray-500">{{ day.dayName }}</div>
        <div
          :class="[
            'text-lg font-semibold mt-0.5',
            day.isToday ? 'w-8 h-8 mx-auto rounded-full bg-primary text-white flex items-center justify-center' : 'text-gray-900'
          ]"
        >
          {{ day.dayNum }}
        </div>
      </div>
    </div>
    
    <!-- 时间轴区域 -->
    <div class="flex-1 overflow-y-auto scrollbar-thin">
      <div class="flex">
        <!-- 时间刻度 -->
        <div class="w-16 flex-shrink-0 border-r border-gray-200 bg-white">
          <div
            v-for="slot in timeSlots"
            :key="slot.hour"
            :style="{ height: `${HOUR_HEIGHT}px` }"
            class="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500"
          >
            {{ slot.label }}
          </div>
        </div>
        
        <!-- 每天的任务列 -->
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="flex-1 min-w-[80px] relative border-r border-gray-200 last:border-r-0"
          :style="{ height: `${24 * HOUR_HEIGHT}px` }"
        >
          <!-- 小时分隔线 -->
          <div
            v-for="slot in timeSlots"
            :key="slot.hour"
            :style="{ top: `${slot.hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }"
            class="absolute left-0 right-0 border-b border-gray-100"
          />
          
          <!-- 任务滑块 -->
          <TaskSlider
            v-for="task in getTasksForDate(day.dateStr)"
            :key="task.id"
            :task="task"
            :style="getTaskStyle(task)"
            class="absolute left-1 right-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>
