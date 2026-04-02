<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import DayView from '@/components/calendar/DayView.vue'
import WeekView from '@/components/calendar/WeekView.vue'
import MonthView from '@/components/calendar/MonthView.vue'
import TaskPanel from '@/components/task/TaskPanel.vue'

const taskStore = useTaskStore()
const viewStore = useViewStore()

// 初始化加载任务
onMounted(() => {
  taskStore.loadTasks()
})
</script>

<template>
  <div class="h-full">
    <!-- 主内容区 -->
    <div class="h-full overflow-hidden">
      <!-- 根据视图类型显示不同组件 -->
      <DayView v-if="viewStore.viewType === 'day'" />
      <WeekView v-else-if="viewStore.viewType === 'week'" />
      <MonthView v-else />
    </div>
  </div>
</template>
