import dayjs from 'dayjs'
import { HOUR_HEIGHT, TIME_GRANULARITY } from './constants'

/**
 * 时间字符串转像素位置
 * @param timeStr 时间字符串 (HH:mm)
 * @returns 像素位置
 */
export function timeToPixels(timeStr: string): number {
  const [hour, min] = timeStr.split(':').map(Number)
  return hour * HOUR_HEIGHT + (min / 60) * HOUR_HEIGHT
}

/**
 * 像素位置转时间字符串
 * @param pixels 像素位置
 * @returns 时间字符串 (HH:mm)
 */
export function pixelsToTime(pixels: number): string {
  const totalMinutes = (pixels / HOUR_HEIGHT) * 60
  const roundedMinutes = Math.round(totalMinutes / TIME_GRANULARITY) * TIME_GRANULARITY
  const hours = Math.floor(roundedMinutes / 60)
  const mins = roundedMinutes % 60
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
  const top = timeToPixels(startTime)
  const bottom = timeToPixels(endTime)
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
 * @returns 新时间字符串
 */
export function offsetTime(timeStr: string, offsetMinutes: number): string {
  const time = dayjs(`2000-01-01 ${timeStr}`)
  return time.add(offsetMinutes, 'minute').format('HH:mm')
}
