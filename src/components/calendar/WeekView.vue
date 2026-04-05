<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { useDragStore } from '@/stores/drag'
import TaskSlider from '@/components/task/TaskSlider.vue'
import DropIndicator from '@/components/common/DropIndicator.vue'
import { HOUR_HEIGHT, LIST_DRAG_OFFSET } from '@/utils/constants'
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

// 处理从任务列表拖拽到某天
function handleDragOver(event: DragEvent, dateIndex: number) {
  event.preventDefault()
  
  if (dragStore.isDraggingFromList) {
    event.dataTransfer!.dropEffect = 'move'
    
    // 计算目标时间
    const column = document.querySelectorAll('.day-column')[dateIndex]
    if (column) {
      const rect = column.getBoundingClientRect()
      const y = event.clientY - rect.top
      const hour = Math.max(0, Math.min(23, Math.floor(y / HOUR_HEIGHT)))
      const minutes = Math.floor((y % HOUR_HEIGHT) / (HOUR_HEIGHT / 60))
      
      dragStore.setTargetTime(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0').substring(0, 2)}`)
      targetDateIndex.value = dateIndex
      dragStore.setTargetDate(weekDays.value[dateIndex].dateStr)
    }
  }
}

// 拖拽离开时清除状态
function handleDragLeave(event: DragEvent) {
  // 检查是否真正离开了日期列
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  // 如果进入的是当前目标的子元素，不清除
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }
  
  // 真正离开时才清除
  targetDateIndex.value = null
  dragStore.setTargetTime(null)
  dragStore.setTargetDate(null)
}

// 根据开始时间计算1小时后的结束时间
function calcEndTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  const endHour = h + 1
  return `${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// 从列表拖入时，修正目标时间使其与气泡显示时间一致（虚线上移了 LIST_DRAG_OFFSET 像素）
function getEffectiveStartTime(targetTime: string): string {
  if (!dragStore.isDraggingFromList) return targetTime
  
  const offsetMinutes = Math.round(LIST_DRAG_OFFSET / (HOUR_HEIGHT / 60))
  const [hour, min] = targetTime.split(':').map(Number)
  const totalMinutes = hour * 60 + min - offsetMinutes
  const clampedMinutes = Math.max(0, Math.min(24 * 60 - 1, totalMinutes))
  const h = Math.floor(clampedMinutes / 60)
  const m = clampedMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// 处理拖放任务（创建新日程）- 桌面端
function handleDrop(event: DragEvent, dateIndex: number) {
  if (!dragStore.isDraggingFromList || !dragStore.draggingTask) return
  
  event.preventDefault()
  
  // 使用修正后的目标时间和目标日期（从列表拖入时减去偏移量对应的时间）
  const dateStr = dragStore.targetDate || weekDays.value[dateIndex].dateStr
  const startTime = getEffectiveStartTime(dragStore.targetTime || '09:00')
  const endTime = calcEndTime(startTime)
  
  // 为任务创建日程实例
  taskStore.scheduleTaskOnDate(dragStore.draggingTask.id, dateStr, startTime, endTime)
  
  // 清除状态并结束拖拽
  targetDateIndex.value = null
  dragStore.setTargetTime(null)
  dragStore.setTargetDate(null)
  dragStore.endDrag()
}

// 处理自定义 drop 事件（移动端触摸）
function handleCustomDrop(event: Event, dateIndex: number) {
  const customEvent = event as CustomEvent<{ x: number; y: number; task: any }>
  const { task } = customEvent.detail
  
  if (!task) return
  
  // 使用修正后的目标时间和目标日期（从列表拖入时减去偏移量对应的时间）
  const dateStr = dragStore.targetDate || weekDays.value[dateIndex].dateStr
  const startTime = getEffectiveStartTime(dragStore.targetTime || '09:00')
  const endTime = calcEndTime(startTime)
  
  // 为任务创建日程实例
  taskStore.scheduleTaskOnDate(task.id, dateStr, startTime, endTime)
  
  // 清除状态
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
    <!-- 时间轴区域（包含 sticky 表头） -->
    <div class="flex-1 overflow-y-auto scrollbar-thin" style="-webkit-overflow-scrolling: touch;">
      <!-- 日期头部（sticky） -->
      <div class="grid border-b border-gray-200 bg-white sticky top-0 z-10" style="grid-template-columns: 64px repeat(7, 1fr);">
        <div class="border-r border-gray-200" />
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="border-r border-gray-200 last:border-r-0 py-2 text-center"
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

      <div class="grid" style="grid-template-columns: 64px repeat(7, 1fr);">
        <!-- 时间刻度 -->
        <div class="border-r border-gray-200 bg-white">
          <div
            v-for="slot in timeSlots"
            :key="slot.hour"
            :style="{ height: `${HOUR_HEIGHT}px` }"
            class="flex items-start justify-end pr-2 pt-1 text-sm md:text-xs text-gray-500"
          >
            {{ slot.label }}
          </div>
        </div>

        <!-- 每天的任务列 -->
        <div
          v-for="(day, index) in weekDays"
          :key="day.dateStr"
          :class="[
            'relative border-r border-gray-200 last:border-r-0 day-column',
            targetDateIndex === index && 'drop-target-highlight'
          ]"
          :style="{ height: `${24 * HOUR_HEIGHT}px` }"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, index)"
          @custom-drop="handleCustomDrop($event, index)"
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
