import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ViewType } from '@/types'
import dayjs from 'dayjs'

export const useViewStore = defineStore('view', () => {
  // 状态
  const viewType = ref<ViewType>('day')
  const currentDate = ref(new Date())

  // 计算属性
  const currentDateString = computed(() => {
    return dayjs(currentDate.value).format('YYYY-MM-DD')
  })

  // 当前周的范围
  const currentWeekRange = computed(() => {
    const start = dayjs(currentDate.value).startOf('week')
    const end = dayjs(currentDate.value).endOf('week')
    return {
      start: start.toDate(),
      end: end.toDate(),
      startStr: start.format('YYYY-MM-DD'),
      endStr: end.format('YYYY-MM-DD'),
    }
  })

  // 当前月的范围
  const currentMonthRange = computed(() => {
    const start = dayjs(currentDate.value).startOf('month')
    const end = dayjs(currentDate.value).endOf('month')
    return {
      start: start.toDate(),
      end: end.toDate(),
      startStr: start.format('YYYY-MM-DD'),
      endStr: end.format('YYYY-MM-DD'),
    }
  })

  // 设置视图类型
  function setViewType(type: ViewType) {
    viewType.value = type
  }

  // 上一个时间段
  function goPrev() {
    const current = dayjs(currentDate.value)
    switch (viewType.value) {
      case 'day':
        currentDate.value = current.subtract(1, 'day').toDate()
        break
      case 'week':
        currentDate.value = current.subtract(1, 'week').toDate()
        break
      case 'month':
        currentDate.value = current.subtract(1, 'month').toDate()
        break
    }
  }

  // 下一个时间段
  function goNext() {
    const current = dayjs(currentDate.value)
    switch (viewType.value) {
      case 'day':
        currentDate.value = current.add(1, 'day').toDate()
        break
      case 'week':
        currentDate.value = current.add(1, 'week').toDate()
        break
      case 'month':
        currentDate.value = current.add(1, 'month').toDate()
        break
    }
  }

  // 回到今天
  function goToday() {
    currentDate.value = new Date()
  }

  // 设置指定日期
  function setDate(date: Date | string) {
    if (typeof date === 'string') {
      currentDate.value = new Date(date)
    } else {
      currentDate.value = date
    }
  }

  return {
    // 状态
    viewType,
    currentDate,
    // 计算属性
    currentDateString,
    currentWeekRange,
    currentMonthRange,
    // 方法
    setViewType,
    goPrev,
    goNext,
    goToday,
    setDate,
  }
})
