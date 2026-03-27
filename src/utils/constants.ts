// 时间轴配置
export const HOUR_HEIGHT = 60 // 每小时高度（像素）
export const HEADER_HEIGHT = 40 // 头部高度
export const TIME_GRANULARITY = 15 // 时间粒度（分钟）
export const MOVE_THRESHOLD = 5 // 移动阈值（像素）

// 任务颜色
export const TASK_COLORS = {
  blue: { bg: 'bg-task-blue/20', border: 'border-task-blue', text: 'text-task-blue' },
  green: { bg: 'bg-task-green/20', border: 'border-task-green', text: 'text-task-green' },
  orange: { bg: 'bg-task-orange/20', border: 'border-task-orange', text: 'text-task-orange' },
  red: { bg: 'bg-task-red/20', border: 'border-task-red', text: 'text-task-red' },
  purple: { bg: 'bg-task-purple/20', border: 'border-task-purple', text: 'text-task-purple' },
  gray: { bg: 'bg-task-gray/20', border: 'border-task-gray', text: 'text-task-gray' },
} as const

// 颜色选择器选项
export const COLOR_OPTIONS = [
  { value: 'blue', label: '工作' },
  { value: 'green', label: '学习' },
  { value: 'orange', label: '重要' },
  { value: 'red', label: '紧急' },
  { value: 'purple', label: '个人' },
  { value: 'gray', label: '临时' },
] as const
