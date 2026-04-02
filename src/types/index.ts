// 任务颜色类型（预设颜色或自定义 hex 值）
export type TaskColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | string

// 任务接口
export interface Task {
  id: string
  title: string
  color: TaskColor
  startDate: string // ISO 格式日期
  endDate: string // ISO 格式日期
  startTime: string // HH:mm 格式
  endTime: string // HH:mm 格式
  note?: string
  createdAt: number
  updatedAt: number
}

// 视图类型
export type ViewType = 'day' | 'week' | 'month'

// 任务创建参数
export interface CreateTaskParams {
  title: string
  color: TaskColor
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  note?: string
}

// 任务更新参数
export interface UpdateTaskParams extends Partial<CreateTaskParams> {
  id: string
}

// 拖拽类型
export type DragType = 'move' | 'resize-start' | 'resize-end'

// 拖拽状态
export interface DragState {
  isDragging: boolean
  dragType: DragType | null
  taskId: string | null
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
  [date: string]: Task[]
}

// 从 constants 重新导出
export { TASK_COLORS, COLOR_OPTIONS } from '@/utils/constants'
