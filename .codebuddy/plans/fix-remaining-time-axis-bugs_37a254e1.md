---
name: fix-remaining-time-axis-bugs
overview: 修复时间轴改为06:00~24:00后遗留的5个显示/数据bug：DropIndicator虚线错位、DayView红线错位、WeekView分隔线错位、task默认时间越界、DropIndicator边界钳位范围错误。
design:
  architecture:
    framework: vue
todos:
  - id: fix-dropindicator
    content: 修复 DropIndicator.vue：导入 TIME_START_HOUR/timeToPixels，修正 yPosition 和 displayTime 边界钳位
    status: completed
  - id: fix-dayview-timeline
    content: 修复 DayView.vue 第263行红色当前时间线 top 计算，加入小时范围判断
    status: completed
  - id: fix-weekview-separators
    content: 修复 WeekView.vue 第286行小时分隔线 top 位置，用 slot.hour - TIME_START_HOUR
    status: completed
  - id: fix-task-defaults
    content: 修复 task.ts 第118行 scheduleTaskOnDate 默认时间为 09:00~10:00
    status: completed
  - id: verify-all
    content: 全量 lint 检查确认零错误
    status: completed
    dependencies:
      - fix-dropindicator
      - fix-dayview-timeline
      - fix-weekview-separators
      - fix-task-defaults
---

## 产品概述

修复日历时间轴从 00:00~24:00 改为 06:00~24:00 后遗留的 **5 个时间-像素映射未同步的 Bug**，确保所有组件的时间计算统一基于新的 `TIME_START_HOUR=6` 起点。

## 核心功能

| Bug | 文件 | 问题 | 影响 |
| --- | --- | --- | --- |
| BUG1 | DropIndicator.vue:23 | yPosition 用 `hour * HOUR_HEIGHT` 未减 TIME_START_HOUR 偏移 | 蓝色拖拽虚线向下偏移约360px |
| BUG2 | DayView.vue:263 | 红线 top 用 `getHours() * HOUR_HEIGHT` 未减偏移 | 红色当前时间线位置错误 |
| BUG3 | WeekView.vue:286 | 分隔线用 `slot.hour * HOUR_HEIGHT` 但 slot.hour 已是6~23 | 所有分隔线整体下移360px |
| BUG4 | task.ts:118 | 默认日程时间 `'01:00'~'02:00'` 超出 [06:00,24:00] | 从列表拖入创建日程默认值不规范 |
| BUG5 | DropIndicator.vue:38 | displayTime 钳位范围仍为 `[0, 1439]` | 气泡时间边界保护不正确 |


## 技术栈

- Vue 3 + TypeScript + Tailwind CSS（已有项目）
- 目标文件：DropIndicator.vue、DayView.vue、WeekView.vue、task.ts、time.ts

## 实现方案

### 核心策略：统一使用 timeToPixels() 函数

**最佳做法**：不再让各组件自行做 `(hour - TIME_START_HOUR) * HOUR_HEIGHT` 计算，而是直接复用 `time.ts` 中已有的 `timeToPixels()` 函数。这样：

- 单一数据源，避免各处算式不一致
- 未来修改时间轴起点时只需改一个函数

具体改动：

1. **DropIndicator.vue**：导入 `TIME_START_HOUR` 和 `timeToPixels()`，yPosition 改用 `timeToPixels(props.time)`；displayTime 边界改为 `[TIME_START_HOUR*60, (TIME_END_HOUR-1)*60+59]`
2. **DayView.vue：263行红线**：top 计算改为 `(currentTime.getHours() - TIME_START_HOUR) * HOUR_HEIGHT + ...`，并加 `v-if` 判断仅在 `getHours() >= TIME_START_HOUR` 时显示
3. **WeekView.vue：286行分隔线**：改用索引 `(i)` 或 `(slot.hour - TIME_START_HOUR)` 计算像素位置
4. **task.ts：118行**：默认参数改为 `'09:00'~'10:00'`

### 关键注意事项

- WeekView 的分隔线 `slot.hour` 值域是 [6, 23]，需要减去 `TIME_STARTHour(6)` 映射到像素 [0, 17*60]
- DayView 的红线在凌晨（0-5点）不应显示或显示在顶部，因为不在时间轴范围内
- DropIndicator 同时被 DayView 和 WeekView 使用，两处的坐标系统已统一（都基于06:00），所以只需修一处