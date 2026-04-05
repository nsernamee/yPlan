<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { useDragStore } from '@/stores/drag'
import { TASK_COLORS } from '@/types'
import type { Task, TaskWithSchedule } from '@/types'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const viewStore = useViewStore()
const dragStore = useDragStore()

// 预设颜色
const presetColors = ['blue', 'green', 'orange', 'red', 'purple', 'gray']

// 获取任务颜色样式
function getTaskColorStyle(task: Task) {
  const isCustomColor = !presetColors.includes(task.color)
  
  if (isCustomColor) {
    return {
      bg: '',
      text: '',
      customBg: `${task.color}20`,
      customText: task.color
    }
  }
  
  return {
    bg: TASK_COLORS[task.color as keyof typeof TASK_COLORS].bg,
    text: TASK_COLORS[task.color as keyof typeof TASK_COLORS].text,
    customBg: '',
    customText: ''
  }
}

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

// 监听全局 dragStore.targetDate 变化，同步高亮索引（移动端 touchMove / 桌面端 dragover 均通过此路径）
watch(() => dragStore.targetDate, (dateStr) => {
  if (dateStr) {
    const index = monthGrid.value.findIndex(d => d.dateStr === dateStr)
    targetDateIndex.value = index !== -1 ? index : null
  } else {
    targetDateIndex.value = null
  }
})

// 获取某天的日程实例
function getTasksForDate(dateStr: string): TaskWithSchedule[] {
  return taskStore.getScheduleInstancesForDate(dateStr)
}

// 点击日期
function handleDateClick(dateStr: string) {
  viewStore.setDate(dateStr)
  viewStore.setViewType('day')
}

// 点击任务（传递 task + schedule）
function handleTaskClick(item: TaskWithSchedule, event: Event) {
  event.stopPropagation()
  taskStore.openEditPanel(item.task, item.schedule)
}

// 任务拖拽开始（传递 scheduleId）
function handleTaskDragStart(item: TaskWithSchedule, event: PointerEvent) {
  event.stopPropagation()
  event.preventDefault()  // 阻止浏览器原生拖拽和文本选择
  
  // 只响应左键
  if (event.button !== 0 && event.button !== undefined) return
  
  // 初始化拖拽
  dragStore.startDrag({
    task: item.task,
    scheduleId: item.schedule.id,
    startTime: item.schedule.startTime,
    endTime: item.schedule.endTime,
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
  // 如果有目标日期，移动日程
  if (targetDateIndex.value !== null && dragStore.draggingScheduleId) {
    const targetDate = monthGrid.value[targetDateIndex.value].dateStr
    
    // 更新日程日期（保留原时间）
    taskStore.updateSchedule({
      id: dragStore.draggingScheduleId,
      date: targetDate,
    })
  }
  
  // 清理
  dragStore.endDrag()
  targetDateIndex.value = null
  
  document.removeEventListener('pointermove', handleGlobalDragMove)
  document.removeEventListener('pointerup', handleGlobalDragEnd)
}

// 从列表拖入：允许 drop（无条件 preventDefault，与 DayView 一致）
function handleGridDragOver(event: DragEvent) {
  event.preventDefault()
  
  if (!dragStore.isDraggingFromList) return
  event.dataTransfer!.dropEffect = 'move'
  
  // 检测鼠标悬停在哪个日期单元格
  const cells = document.querySelectorAll('.month-cell')
  cells.forEach((cell, index) => {
    const rect = cell.getBoundingClientRect()
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) {
      targetDateIndex.value = index
      dragStore.setTargetDate(monthGrid.value[index].dateStr)
    }
  })
}

// 从列表拖入离开网格区域
function handleGridDragLeave(event: DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const gridEl = event.currentTarget as HTMLElement
  
  // 只有真正离开网格区域才清除高亮（不是进入子元素）
  if (!gridEl.contains(relatedTarget)) {
    targetDateIndex.value = null
    dragStore.setTargetDate(null)
  }
}

// 从列表拖入释放：在目标日期创建日程
function handleGridDrop(event: DragEvent) {
  if (!dragStore.isDraggingFromList || !dragStore.draggingTask) return
  
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  
  // 使用目标日期，如果没有则使用当前月的第1天
  const targetDate = dragStore.targetDate || monthGrid.value[0].dateStr
  
  // 创建默认时间段的日程（09:00 - 10:00）
  taskStore.scheduleTaskOnDate(
    dragStore.draggingTask.id,
    targetDate,
    '09:00',
    '10:00'
  )
  
  // 清理
  targetDateIndex.value = null
  dragStore.setTargetTime(null)
  dragStore.setTargetDate(null)
  dragStore.endDrag()
}

// 移动端触摸拖放（通过 CustomEvent 接收）
function handleCustomDrop(event: Event) {
  if (!dragStore.draggingTask) return
  
  // 使用目标日期（由 handleTouchMove 在 TaskListDrawer 中设置），或回退到第1天
  const targetDate = dragStore.targetDate || monthGrid.value[0].dateStr
  
  taskStore.scheduleTaskOnDate(
    dragStore.draggingTask.id,
    targetDate,
    '09:00',
    '10:00'
  )
  
  // 清理
  targetDateIndex.value = null
  dragStore.setTargetTime(null)
  dragStore.setTargetDate(null)
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
    <div
      class="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto month-grid"
      @dragover="handleGridDragOver($event)"
      @dragleave="handleGridDragLeave($event)"
      @drop="handleGridDrop($event)"
      @custom-drop="handleCustomDrop($event)"
    >
      <div
        v-for="(day, index) in monthGrid"
        :key="day.dateStr"
        :data-date="day.dateStr"
        @click="handleDateClick(day.dateStr)"
        :class="[
          'border-b border-r border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors month-cell relative',
          { 'bg-gray-50/50': !day.isCurrentMonth },
          { 'drop-target-active': targetDateIndex !== null && targetDateIndex === index }
        ]"
      >
        <!-- 拖放目标虚线提示（从列表拖入 + 月视图内拖动均显示） -->
        <div
          v-if="targetDateIndex === index && (dragStore.isDraggingFromList || dragStore.isFreeDrag)"
          class="absolute inset-0 pointer-events-none z-10 rounded-lg animate-scale-in"
        >
          <div class="inset-0 border-2 border-dashed border-primary rounded-lg" />
          <div class="absolute top-1 left-1 px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-primary shadow whitespace-nowrap">
            {{ day.dayNum }}日
          </div>
        </div>
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
            v-for="item in getTasksForDate(day.dateStr).slice(0, 3)"
            :key="item.schedule.id"
            @click="handleTaskClick(item, $event)"
            @pointerdown="handleTaskDragStart(item, $event)"
            :class="[
              'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer select-none',
              'touch-action-none',
              getTaskColorStyle(item.task).bg,
              getTaskColorStyle(item.task).text,
              'hover:opacity-80 active:opacity-60'
            ]"
            :style="getTaskColorStyle(item.task).customBg ? {
              backgroundColor: getTaskColorStyle(item.task).customBg,
              color: getTaskColorStyle(item.task).customText
            } : undefined"
          >
            {{ item.task.title }}
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

<style scoped>
/* 禁止月视图任务的原生文本选择和拖拽 */
.touch-action-none {
  touch-action: none;
  user-select: none;
  -webkit-user-drag: none;  /* 禁止浏览器原生拖拽 */
}

/* 拖放目标激活状态（虚线边框由内部子元素实现） */
.drop-target-active {
  background-color: rgba(97, 141, 255, 0.06) !important;
}
</style>
