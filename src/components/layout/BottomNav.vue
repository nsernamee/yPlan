<script setup lang="ts">
import { useViewStore } from '@/stores/view'
import { Calendar, Clock, Grid, List } from 'lucide-vue-next'

const viewStore = useViewStore()

const tabs = [
  { key: 'day', label: '日视图', icon: Clock },
  { key: 'week', label: '周视图', icon: Calendar },
  { key: 'month', label: '月视图', icon: Grid },
  { key: 'list', label: '任务列表', icon: List },
] as const

const switchView = (view: 'day' | 'week' | 'month') => {
  viewStore.setViewType(view)
}
</script>

<template>
  <!-- 底部导航 - 磨砂玻璃效果 -->
  <nav class="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50 flex items-center justify-around px-4">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      @click="tab.key !== 'list' && switchView(tab.key)"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200',
        viewStore.viewType === tab.key
          ? 'text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
      ]"
    >
      <component :is="tab.icon" class="w-5 h-5" />
      <span class="text-xs">{{ tab.label }}</span>
    </button>
  </nav>
</template>
