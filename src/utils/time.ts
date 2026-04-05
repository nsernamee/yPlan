import dayjs from 'dayjs'
import { HOUR_HEIGHT, TIME_GRANULARITY, MIN_DURATION, TIME_START_HOUR, TIME_END_HOUR, TIME_AXIS_HOURS } from './constants'

/**
 * 将时间钳位到时间轴范围内 [06:00, 23:59]
 * 超出范围时直接吸附到边界值
 */
export function clampTime(timeStr: string): string {
  const totalMin = (() => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  })()

  const minMin = TIME_START_HOUR * 60       // 360 (06:00)
  const maxMin = TIME_END_HOUR * 60 + 59    // 1439 (23:59)

  if (totalMin <= minMin) {
    return `${TIME_START_HOUR.toString().padStart(2, '0')}:00`
  }
  if (totalMin >= maxMin) {
    return `${TIME_END_HOUR.toString().padStart(2, '0')}:59`
  }
  return timeStr
}

/**
 * 时间字符串转像素位置（基于时间轴起点 TIME_START_HOUR）
 * @param timeStr 时间字符串 (HH:mm)
 * @returns 像素位置（相对于时间轴起点）
 */
export function timeToPixels(timeStr: string): number {
  const [hour, min] = timeStr.split(':').map(Number)
  return (hour - TIME_START_HOUR) * HOUR_HEIGHT + (min / 60) * HOUR_HEIGHT
}

/**
 * 像素位置转时间字符串
 * @param pixels 像素位置（相对于时间轴起点）
 * @returns 时间字符串 (HH:mm)
 */
export function pixelsToTime(pixels: number): string {
  const totalMinutes = (pixels / HOUR_HEIGHT) * 60 + TIME_START_HOUR * 60
  const roundedMinutes = Math.round(totalMinutes / TIME_GRANULARITY) * TIME_GRANULARITY
  // 钳位到合法时间轴范围，防止超范围像素产生非法时间
  const minMin = TIME_START_HOUR * 60
  const maxMin = TIME_END_HOUR * 60 + 59
  const clampedMinutes = Math.max(minMin, Math.min(maxMin, roundedMinutes))
  const hours = Math.floor(clampedMinutes / 60)
  const mins = clampedMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * 计算偏移量对应的时间变化（分钟）
 * @param offsetY Y轴偏移量（像素）
 * @returns 时间变化（分钟，按粒度取整）
 */
export function offsetToMinutes(offsetY: number): number {
  const totalMinutes = (offsetY / HOUR_HEIGHT) * 60
  return Math.round(totalMinutes / TIME_GRANULARITY) * TIME_GRANULARITY
}

/**
 * 计算任务位置和高度
 * @param startTime 开始时间 (HH:mm)
 * @param endTime 结束时间 (HH:mm)
 * @returns { top, height }
 */
export function calculateTaskPosition(startTime: string, endTime: string): { top: number; height: number } {
  // 先将时间钳位到合法范围
  const clampedStart = clampTime(startTime)
  const clampedEnd = clampTime(endTime)

  let top = timeToPixels(clampedStart)
  let bottom = timeToPixels(clampedEnd)

  const maxBottom = TIME_AXIS_HOURS * HOUR_HEIGHT

  // 关键修复：检测 endTime 是否因 clamp 回绕（如 23:40 + duration → 00:30 → clamp → 06:00）
  // 当 endTime 被回绕到 startTime 之前时，直接把 endTime 锁定在时间轴底部
  const startTotalMin = (() => { const [h,m] = clampedStart.split(':').map(Number); return h*60+m })()
  const endTotalMin = (() => { const [h,m] = clampedEnd.split(':').map(Number); return h*60+m })()
  
  if (endTotalMin < startTotalMin) {
    // endTime 回绕了，锁定到底部边界
    bottom = maxBottom
    top = Math.max(0, bottom - Math.max(30, HOUR_HEIGHT / 60 * MIN_DURATION))
  } else {
    // 正常情况：防止上下界反转（短任务）
    if (bottom <= top) {
      bottom = top + Math.max(30, HOUR_HEIGHT / 60 * MIN_DURATION)
    }

    // 如果底部超出时间轴，调整顶部以保持合理高度
    if (bottom > maxBottom) {
      bottom = maxBottom
      top = bottom - (timeToPixels(clampedEnd) - timeToPixels(clampedStart))
      if (top < 0) {
        top = 0
        bottom = maxBottom
      }
    }
  }

  return {
    top,
    height: Math.max(30, bottom - top),
  }
}

/**
 * 格式化时间显示
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 格式化后的时间范围字符串
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`
}

/**
 * 计算时间差（分钟）
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 时间差（分钟）
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = dayjs(`2000-01-01 ${startTime}`)
  const end = dayjs(`2000-01-01 ${endTime}`)
  return end.diff(start, 'minute')
}

/**
 * 偏移时间
 * @param timeStr 原始时间
 * @param offsetMinutes 偏移分钟数
 * @returns 新时间字符串（已钳位到 [06:00, 23:59]）
 */
export function offsetTime(timeStr: string, offsetMinutes: number): string {
  const time = dayjs(`2000-01-01 ${timeStr}`)
  const result = time.add(offsetMinutes, 'minute').format('HH:mm')
  return clampTime(result)
}
