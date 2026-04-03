<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { useDragStore } from '@/stores/drag'
import TaskSlider from '@/components/task/TaskSlider.vue'
import DropIndicator from '@/components/common/DropIndicator.vue'
import { HOUR_HEIGHT, HEADER_HEIGHT } from '@/utils/constants'
import { calculateTaskPosition, calculateDuration, offsetTime } from '@/utils/time'
import dayjs from 'dayjs'
import type { TaskWithSchedule } from '@/types'

const taskStore = useTaskStore()
const viewStore = useViewStore()
const dragStore = useDragStore()

// 时间轴容器
const timeAxisRef = ref<HTMLElement | null>(null)

// 当前时间（实时更新）
const currentTime = ref(new Date())
let timeUpdateInterval: number | null = null

// 格式化当前时间 HH:mm
const currentTimeStr = computed(() => {
  const hours = currentTime.value.getHours().toString().padStart(2, '0')
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

// 当前日期的日程实例（TaskWithSchedule[]）
const currentTasks = computed(() => {
  const dateStr = dayjs(viewStore.currentDate).format('YYYY-MM-DD')
  return taskStore.getScheduleInstancesForDate(dateStr)
})

// 计算任务位置和高度
function getTaskStyle(item: TaskWithSchedule) {
  const { top, height } = calculateTaskPosition(item.schedule.startTime, item.schedule.endTime)
  return {
    top: `${HEADER_HEIGHT + top}px`,
    height: `${height}px`,
  }
}

// 计算拖拽日程的持续时间
const draggingTaskDuration = computed(() => {
  // 从 dragStore 获取正在拖拽的日程信息
  if (!dragStore.draggingTask || !dragStore.draggingScheduleId) return 0
  
  // 从 taskStore 查找对应的 schedule
  const schedule = taskStore.schedules.find(s => s.id === dragStore.draggingScheduleId)
  if (!schedule) return 0
  
  return calculateDuration(schedule.startTime, schedule.endTime)
})

// 处理任务拖拽结束
function handleTaskDragEnd(payload: { taskId: string; scheduleId: string; position: { x: number; y: number } }) {
  if (!dragStore.draggingScheduleId) return
  
  const schedule = taskStore.schedules.find(s => s.id === dragStore.draggingScheduleId)
  if (!schedule) return
  
  // 直接使用拖拽过程中计算好的目标时间
  const newStartTime = dragStore.targetTime || schedule.startTime
  
  // 计算持续时间
  const duration = calculateDuration(schedule.startTime, schedule.endTime)
  
  // 计算新的结束时间
  const newEndTime = offsetTime(newStartTime, duration)
  
  // 更新日程时间
  taskStore.updateSchedule({
    id: dragStore.draggingScheduleId,
    startTime: newStartTime,
    endTime: newEndTime,
  })
}

// 点击空白区域创建任务
function handleTimeAxisClick(event: MouseEvent) {
  if (!timeAxisRef.value) return
  
  const rect = timeAxisRef.value.getBoundingClientRect()
  const y = event.clientY - rect.top + timeAxisRef.value.scrollTop - HEADER_HEIGHT
  const hour = Math.max(0, Math.floor(y / HOUR_HEIGHT))
  
  taskStore.openCreatePanel(
    dayjs(viewStore.currentDate).format('YYYY-MM-DD'),
    hour
  )
}

// 处理从任务列表拖拽的任务
function handleDragOver(event: DragEvent) {
  if (!dragStore.isDraggingFromList) return
  
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

// 处理拖放任务（创建新日程）
function handleDrop(event: DragEvent) {
  if (!dragStore.isDraggingFromList || !dragStore.draggingTask || !timeAxisRef.value) return
  
  event.preventDefault()
  
  const rect = timeAxisRef.value.getBoundingClientRect()
  const y = event.clientY - rect.top + timeAxisRef.value.scrollTop - HEADER_HEIGHT
  const hour = Math.max(0, Math.min(23, Math.floor(y / HOUR_HEIGHT)))
  
  const dateStr = dayjs(viewStore.currentDate).format('YYYY-MM-DD')
  const startTime = `${hour.toString().padStart(2, '0')}:00`
  const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
  
  // 为任务创建日程实例
  taskStore.scheduleTaskOnDate(dragStore.draggingTask.id, dateStr, startTime, endTime)
  
  // 结束拖拽
  dragStore.endDrag()
}

// 滚动到当前时间
function scrollToCurrentTime() {
  if (!timeAxisRef.value) return
  
  const now = new Date()
  const hour = now.getHours()
  const scrollTo = hour * HOUR_HEIGHT - 100
  
  timeAxisRef.value.scrollTop = Math.max(0, scrollTo)
}

onMounted(() => {
  scrollToCurrentTime()
  
  // 每分钟更新时间线位置
  timeUpdateInterval = window.setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 时间轴区域 -->
    <div
      ref="timeAxisRef"
      class="flex-1 overflow-y-auto scrollbar-thin bg-white"
    >
      <div class="relative flex">
        <!-- 时间刻度 -->
        <div class="w-16 flex-shrink-0 border-r border-gray-200">
          <div :style="{ height: `${HEADER_HEIGHT}px` }" class="border-b border-gray-200" />
          <div
            v-for="hour in 24"
            :key="hour"
            :style="{ height: `${HOUR_HEIGHT}px` }"
            class="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500"
          >
            {{ (hour - 1).toString().padStart(2, '0') }}:00
          </div>
        </div>
        
        <!-- 任务区域 -->
        <div
          class="flex-1 relative"
          :style="{ height: `${24 * HOUR_HEIGHT + HEADER_HEIGHT}px` }"
          @click="handleTimeAxisClick"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <!-- 顶部空白 -->
          <div :style="{ height: `${HEADER_HEIGHT}px` }" class="border-b border-gray-200" />
          
          <!-- 小时分隔线 -->
          <div
            v-for="hour in 24"
            :key="hour"
            :style="{ top: `${HEADER_HEIGHT + (hour - 1) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }"
            class="absolute left-0 right-0 border-b border-gray-100"
          />
          
          <!-- 当前时间线 -->
          <div
            v-if="dayjs(viewStore.currentDate).isSame(dayjs(), 'day')"
            :style="{ top: `${HEADER_HEIGHT + currentTime.getHours() * HOUR_HEIGHT + (currentTime.getMinutes() / 60) * HOUR_HEIGHT}px` }"
            class="absolute left-0 right-0 flex items-center z-10 pointer-events-none -translate-y-1/2"
          >
            <div class="w-2 h-2 rounded-full bg-red-500" />
            <div class="flex-1 h-0.5 bg-red-500" />
            <span class="text-xs font-medium text-red-500 px-2">{{ currentTimeStr }}</span>
            <div class="flex-1 h-0.5 bg-red-500" />
          </div>
          
          <!-- 任务滑块 -->
          <TaskSlider
            v-for="item in currentTasks"
            :key="item.schedule.id"
            :task="item.task"
            :schedule="item.schedule"
            :style="getTaskStyle(item)"
            class="absolute left-2 right-2"
            @drag-end="handleTaskDragEnd"
          />
          
          <!-- 拖拽预览指示器 -->
          <DropIndicator
            v-if="dragStore.isDragging && dragStore.targetTime"
            :time="dragStore.targetTime"
            :duration="draggingTaskDuration"
            :include-header="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>
