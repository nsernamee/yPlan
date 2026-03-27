<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useViewStore } from '@/stores/view'
import { Calendar, ChevronLeft, ChevronRight, Plus, Moon, Sun } from 'lucide-vue-next'

const props = defineProps<{
  isDark?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-dark'): void
}>()

const taskStore = useTaskStore()
const viewStore = useViewStore()

const currentDate = computed(() => viewStore.currentDate)
const viewType = computed(() => viewStore.viewType)

// 日期格式化显示
const dateDisplay = computed(() => {
  const d = currentDate.value
  if (viewType.value === 'month') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

// 上一个时间段
const goPrev = () => {
  viewStore.goPrev()
}

// 下一个时间段
const goNext = () => {
  viewStore.goNext()
}

// 回到今天
const goToday = () => {
  viewStore.goToday()
}

// 切换视图
const switchView = (view: 'day' | 'week' | 'month') => {
  viewStore.setViewType(view)
}

// 新建任务
const createTask = () => {
  taskStore.openCreatePanel()
}
</script>

<template>
  <!-- 顶部导航 - 磨砂玻璃效果 -->
  <header class="fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-50 flex items-center justify-between px-4">
    <!-- 左侧 Logo -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
        <Calendar class="w-5 h-5 text-white" />
      </div>
      <span class="text-lg font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">yPlan</span>
    </div>

    <!-- 中间：日期导航 + 视图切换 -->
    <div class="flex items-center gap-4">
      <!-- 日期导航 -->
      <div class="flex items-center gap-2">
        <button
          @click="goPrev"
          class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors btn-apple"
        >
          <ChevronLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[120px] text-center">
          {{ dateDisplay }}
        </span>
        <button
          @click="goNext"
          class="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors btn-apple"
        >
          <ChevronRight class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <!-- 视图切换 - 苹果风格 -->
      <div class="hidden md:flex items-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1">
        <button
          v-for="view in ['day', 'week', 'month'] as const"
          :key="view"
          @click="switchView(view)"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
            viewType === view
              ? 'bg-white dark:bg-gray-700 text-primary dark:text-primary-light shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          ]"
        >
          {{ view === 'day' ? '日' : view === 'week' ? '周' : '月' }}
        </button>
      </div>
    </div>

    <!-- 右侧：深色模式 + 今日 + 新建 -->
    <div class="flex items-center gap-2">
      <!-- 深色模式切换 -->
      <button
        @click="emit('toggle-dark')"
        class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors btn-apple"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      >
        <Sun v-if="isDark" class="w-5 h-5 text-yellow-400" />
        <Moon v-else class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <button
        @click="goToday"
        class="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors btn-apple"
      >
        今天
      </button>
      <button
        @click="createTask"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">新建</span>
      </button>
    </div>
  </header>
</template>
