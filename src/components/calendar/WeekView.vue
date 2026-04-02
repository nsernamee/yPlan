<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { useDragStore } from '@/stores/drag'
import TaskSlider from '@/components/task/TaskSlider.vue'
import DropIndicator from '@/components/common/DropIndicator.vue'
import { HOUR_HEIGHT } from '@/utils/constants'
import { calculateDuration, offsetTime } from '@/utils/time'
import dayjs from 'dayjs'
import type { TaskWithSchedule } from '@/types'

const taskStore = useTaskStore()
const viewStore = useViewStore()
const dragStore = useDragStore()

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

// 目标日期高亮
const targetDateIndex = ref<number | null>(null)

// 计算拖拽日程的持续时间
const draggingTaskDuration = computed(() => {
  if (!dragStore.draggingScheduleId) return 0
  
  const schedule = taskStore.schedules.find(s => s.id === dragStore.draggingScheduleId)
  if (!schedule) return 0
  
  return calculateDuration(schedule.startTime, schedule.endTime)
})

// 计算任务样式
function getTaskStyle(item: TaskWithSchedule) {
  const [startHour, startMin] = item.schedule.startTime.split(':').map(Number)
  const [endHour, endMin] = item.schedule.endTime.split(':').map(Number)
  
  const top = startHour * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT
  const height = ((endHour - startHour) + (endMin - startMin) / 60) * HOUR_HEIGHT
  
  return {
    top: `${top}px`,
    height: `${Math.max(height, 24)}px`,
  }
}

// 获取某天的日程实例
function getTasksForDate(dateStr: string): TaskWithSchedule[] {
  return taskStore.getScheduleInstancesForDate(dateStr)
}

// 处理任务拖拽结束
function handleTaskDragEnd(payload: { taskId: string; scheduleId: string; position: { x: number; y: number } }) {
  if (!dragStore.draggingScheduleId) return
  
  const schedule = taskStore.schedules.find(s => s.id === dragStore.draggingScheduleId)
  if (!schedule) return
  
  // 确定目标日期：如果有目标日期索引，移动到新日期；否则保持原日期
  const targetDate = targetDateIndex.value !== null
    ? weekDays.value[targetDateIndex.value].dateStr
    : schedule.date
  
  // 直接使用拖拽过程中计算好的目标时间
  const newStartTime = dragStore.targetTime || schedule.startTime
  
  // 计算持续时间
  const duration = calculateDuration(schedule.startTime, schedule.endTime)
  
  // 计算新的结束时间
  const newEndTime = offsetTime(newStartTime, duration)
  
  // 更新日程
  taskStore.updateSchedule({
    id: dragStore.draggingScheduleId,
    date: targetDate,
    startTime: newStartTime,
    endTime: newEndTime,
  })
  
  // 清除高亮
  targetDateIndex.value = null
}

// 监听拖拽位置，检测目标日期
function handleGlobalDragMove() {
  if (!dragStore.isDragging || !dragStore.isFreeDrag) {
    targetDateIndex.value = null
    return
  }
  
  // 检测鼠标在哪一列
  const columns = document.querySelectorAll('.day-column')
  const mouseX = dragStore.currentPosition.x
  
  columns.forEach((col, index) => {
    const rect = col.getBoundingClientRect()
    if (mouseX >= rect.left && mouseX <= rect.right) {
      targetDateIndex.value = index
      dragStore.setTargetDate(weekDays.value[index].dateStr)
    }
  })
}

// 监听拖拽事件
onMounted(() => {
  // 定期检查拖拽位置
  const interval = setInterval(handleGlobalDragMove, 50)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
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
          v-for="(day, index) in weekDays"
          :key="day.dateStr"
          :class="[
            'flex-1 min-w-[80px] relative border-r border-gray-200 last:border-r-0 day-column',
            targetDateIndex === index && 'drop-target-highlight'
          ]"
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
            v-for="item in getTasksForDate(day.dateStr)"
            :key="item.schedule.id"
            :task="item.task"
            :schedule="item.schedule"
            :style="getTaskStyle(item)"
            class="absolute left-1 right-1"
            @drag-end="handleTaskDragEnd"
          />
          
          <!-- 拖拽预览指示器（仅在目标日期列显示） -->
          <DropIndicator
            v-if="dragStore.isDragging && dragStore.targetTime && targetDateIndex === index"
            :time="dragStore.targetTime"
            :duration="draggingTaskDuration"
          />
        </div>
      </div>
    </div>
  </div>
</template>
