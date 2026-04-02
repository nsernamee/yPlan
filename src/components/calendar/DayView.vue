<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { useDragStore } from '@/stores/drag'
import TaskSlider from '@/components/task/TaskSlider.vue'
import DropIndicator from '@/components/common/DropIndicator.vue'
import { HOUR_HEIGHT, HEADER_HEIGHT } from '@/utils/constants'
import { calculateTaskPosition, pixelsToTime, calculateDuration, offsetTime } from '@/utils/time'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const viewStore = useViewStore()
const dragStore = useDragStore()

// 时间轴容器
const timeAxisRef = ref<HTMLElement | null>(null)

// 当前日期的任务
const currentTasks = computed(() => {
  const dateStr = dayjs(viewStore.currentDate).format('YYYY-MM-DD')
  return taskStore.getTasksByDateRange(dateStr, dateStr)
})

// 计算任务位置和高度
function getTaskStyle(task: typeof currentTasks.value[0]) {
  const { top, height } = calculateTaskPosition(task.startTime, task.endTime)
  return {
    top: `${HEADER_HEIGHT + top}px`,
    height: `${height}px`,
  }
}

// 计算拖拽任务的持续时间
const draggingTaskDuration = computed(() => {
  if (!dragStore.draggingTask) return 0
  return calculateDuration(dragStore.draggingTask.startTime, dragStore.draggingTask.endTime)
})

// 处理任务拖拽结束
function handleTaskDragEnd(payload: { taskId: string; position: { x: number; y: number } }) {
  if (!dragStore.draggingTask) return
  
  const task = dragStore.draggingTask
  
  // 直接使用拖拽过程中计算好的目标时间
  const newStartTime = dragStore.targetTime || task.startTime
  
  // 计算持续时间
  const duration = calculateDuration(task.startTime, task.endTime)
  
  // 计算新的结束时间
  const newEndTime = offsetTime(newStartTime, duration)
  
  // 更新任务时间
  taskStore.updateTask({
    id: payload.taskId,
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
            :style="{ top: `${HEADER_HEIGHT + new Date().getHours() * HOUR_HEIGHT + (new Date().getMinutes() / 60) * HOUR_HEIGHT}px` }"
            class="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
          >
            <div class="w-2 h-2 rounded-full bg-red-500" />
            <div class="flex-1 h-0.5 bg-red-500" />
          </div>
          
          <!-- 任务滑块 -->
          <TaskSlider
            v-for="task in currentTasks"
            :key="task.id"
            :task="task"
            :style="getTaskStyle(task)"
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
