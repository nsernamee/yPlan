// 任务颜色类型（预设颜色或自定义 hex 值）
export type TaskColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | string

// 任务颜色样式（支持预设 + 自定义 hex）
export interface TaskColorStyle {
  bg: string
  border: string
  text: string
  customBg: string
  customBorder: string
}

// 任务接口（仅保存不变属性）
export interface Task {
  id: string
  title: string
  color: TaskColor
  note?: string
  createdAt: number
  updatedAt: number
}

// 日程实例（一个任务可以有多条日程，每条对应一天的时间段）
export interface TaskSchedule {
  id: string
  taskId: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:mm
  endTime: string    // HH:mm
}

// 任务 + 关联日程（用于日历视图渲染）
export interface TaskWithSchedule {
  task: Task
  schedule: TaskSchedule
}

// 任务创建参数
export interface CreateTaskParams {
  title: string
  color: TaskColor
  note?: string
}

// 任务更新参数
export interface UpdateTaskParams extends Partial<CreateTaskParams> {
  id: string
}

// 日程创建参数
export interface CreateScheduleParams {
  taskId: string
  date: string
  startTime: string
  endTime: string
}

// 日程更新参数
export interface UpdateScheduleParams {
  id: string
  date?: string
  startTime?: string
  endTime?: string
}

// 视图类型
export type ViewType = 'day' | 'week' | 'month'

// 拖拽类型
export type DragType = 'move' | 'resize-start' | 'resize-end'

// 拖拽状态
export interface DragState {
  isDragging: boolean
  dragType: DragType | null
  taskId: string | null
  scheduleId: string | null
  startX: number
  startY: number
  startTime: string | null
  endTime: string | null
}

// 时间槽（用于日视图渲染）
export interface TimeSlot {
  hour: number
  label: string
}

// 日任务映射
export interface DayTasks {
  [date: string]: TaskWithSchedule[]
}

// 从 constants 重新导出
export { TASK_COLORS, COLOR_OPTIONS } from '@/utils/constants'
