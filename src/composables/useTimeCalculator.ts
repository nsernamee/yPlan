import { computed, ref } from 'vue'
import { offsetToMinutes, offsetTime, calculateDuration } from '@/utils/time'

export function useTimeCalculator(startTime: string, endTime: string) {
  const originalStartTime = ref(startTime)
  const originalEndTime = ref(endTime)

  /**
   * 根据偏移量计算新的时间范围
   */
  function calculateNewTime(offsetY: number, type: 'move' | 'resize-start' | 'resize-end') {
    const deltaMinutes = offsetToMinutes(offsetY)

    if (type === 'move') {
      const duration = calculateDuration(originalStartTime.value, originalEndTime.value)
      return {
        startTime: offsetTime(originalStartTime.value, deltaMinutes),
        endTime: offsetTime(originalStartTime.value, deltaMinutes + duration),
      }
    } else if (type === 'resize-start') {
      return {
        startTime: offsetTime(originalStartTime.value, deltaMinutes),
        endTime: originalEndTime.value,
      }
    } else if (type === 'resize-end') {
      return {
        startTime: originalStartTime.value,
        endTime: offsetTime(originalEndTime.value, deltaMinutes),
      }
    }

    return {
      startTime: originalStartTime.value,
      endTime: originalEndTime.value,
    }
  }

  /**
   * 获取时间变化量（分钟）
   */
  function getDeltaMinutes(offsetY: number): number {
    return offsetToMinutes(offsetY)
  }

  return {
    originalStartTime,
    originalEndTime,
    calculateNewTime,
    getDeltaMinutes,
  }
}
