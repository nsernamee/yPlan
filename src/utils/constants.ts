// 时间轴配置
export const HOUR_HEIGHT = 60 // 每小时高度（像素）
export const HEADER_HEIGHT = 40 // 头部高度
export const TIME_GRANULARITY = 1 // 时间粒度（分钟），1 = 精确到每分钟
export const MOVE_THRESHOLD = 5 // 移动阈值（像素）
export const MIN_DURATION = 5 // 最小任务持续时间（分钟）
export const LIST_DRAG_OFFSET = 22 // 从列表拖入时虚线上移像素数（兼顾桌面端 ghost image 和移动端 DragPreview 卡片）

// 时间轴范围（从早上6点到晚上11点59分）
export const TIME_START_HOUR = 6 // 时间轴起始小时（包含）
export const TIME_END_HOUR = 23 // 时间轴结束小时（包含，即显示到23:59）
export const TIME_AXIS_HOURS = TIME_END_HOUR - TIME_START_HOUR + 1 // 可见小时数（18小时）

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
