<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import HeaderNav from '@/components/layout/HeaderNav.vue'
import BottomNav from '@/components/layout/BottomNav.vue'

const route = useRoute()

// 判断是否移动端
const isMobile = ref(window.innerWidth < 768)

window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 深色模式
const isDark = ref(false)

onMounted(() => {
  // 初始化深色模式 - 读取 localStorage 或系统偏好
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

// 切换深色模式
function toggleDark() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

// 应用主题
function applyTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 暴露给子组件
defineExpose({ isDark, toggleDark })
</script>

<template>
  <div class="h-full flex flex-col bg-background dark:bg-gray-950 transition-colors duration-300">
    <!-- 顶部导航 -->
    <HeaderNav @toggle-dark="toggleDark" :is-dark="isDark" />

    <!-- 主内容区 -->
    <main class="flex-1 overflow-hidden pt-14 md:pt-14 pb-0 md:pb-0">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 移动端底部导航 -->
    <BottomNav v-if="isMobile" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
