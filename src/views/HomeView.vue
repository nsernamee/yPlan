<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import DayView from '@/components/calendar/DayView.vue'
import WeekView from '@/components/calendar/WeekView.vue'
import MonthView from '@/components/calendar/MonthView.vue'
import TaskList from '@/components/task/TaskList.vue'
import TaskListDrawer from '@/components/task/TaskListDrawer.vue'

const taskStore = useTaskStore()
const viewStore = useViewStore()

// 判断是否移动端
const isMobile = ref(window.innerWidth < 768)

// 监听窗口大小变化
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 初始化加载任务
onMounted(() => {
  taskStore.loadTasks()
})
</script>

<template>
  <div class="h-full flex">
    <!-- 左侧：日历视图 -->
    <div class="flex-1 overflow-hidden">
      <!-- 根据视图类型显示不同组件 -->
      <DayView v-if="viewStore.viewType === 'day'" />
      <WeekView v-else-if="viewStore.viewType === 'week'" />
      <MonthView v-else />
    </div>

    <!-- 右侧：任务列表（桌面端固定显示，移动端隐藏） -->
    <div
      v-if="!isMobile"
      class="w-80 flex-shrink-0 overflow-hidden"
    >
      <TaskList />
    </div>

    <!-- 移动端任务列表抽屉 -->
    <TaskListDrawer
      v-if="isMobile"
      :visible="viewStore.taskDrawerOpen"
      @close="viewStore.closeTaskDrawer"
    />
  </div>
</template>
