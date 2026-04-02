---
name: 修复拖拽精度和日历对齐问题
overview: 修正日/周视图拖拽时间计算精度，修复任务位置显示，确保周/月视图表头与网格对齐
todos:
  - id: fix-dayview-position
    content: 修复日视图任务位置偏移（加上 HEADER_HEIGHT）
    status: completed
  - id: fix-dayview-drag
    content: 修复日视图拖拽时间计算（使用 pixelsToTime）
    status: completed
    dependencies:
      - fix-dayview-position
  - id: fix-dayview-click
    content: 修复日视图点击创建任务的位置计算
    status: completed
    dependencies:
      - fix-dayview-position
  - id: fix-weekview-constants
    content: 清理周视图重复常量定义
    status: completed
  - id: fix-weekview-drag
    content: 修复周视图拖拽时间计算
    status: completed
    dependencies:
      - fix-weekview-constants
  - id: verify-alignment
    content: 验证周视图和月视图表头对齐
    status: completed
---

## 问题概述

修复 yPlan 日程管理应用中的多个精准度和对齐问题。

## 核心问题

1. **日视图任务位置偏移 40px**：`getTaskStyle` 返回的 `top` 缺少 `HEADER_HEIGHT` 偏移，导致所有任务显示位置偏上
2. **拖拽时间计算不精准**：日视图和周视图的拖拽结束时间只计算到整点，未使用精确工具函数，忽略 15 分钟时间粒度
3. **周视图常量冲突**：本地重新定义 `HEADER_HEIGHT = 60`，覆盖了导入的 `HEADER_HEIGHT = 40`
4. **点击创建任务位置错误**：日视图点击空白区域创建任务时位置计算也忽略了顶部偏移
5. **周/月视图表头与网格不对齐**：表头列宽与内容区域列宽需要确保一致

## 修复内容

- 修正日视图任务位置计算（加上 HEADER_HEIGHT 偏移）
- 精确化日视图和周视图的拖拽时间计算（使用 pixelsToTime 函数）
- 清理周视图的重复常量定义，使用导入的常量
- 修正日视图点击创建任务的位置计算
- 统一周视图和月视图的表头与网格列宽

## 技术栈

- Vue 3 + TypeScript
- Tailwind CSS
- dayjs 时间处理库

## 问题根源分析

### 1. 日视图任务位置错误

**位置**: `src/components/calendar/DayView.vue` 第 24-31 行

```typescript
// 当前代码（错误）
function getTaskStyle(task) {
  const { top, height } = calculateTaskPosition(task.startTime, task.endTime)
  return {
    top: `${top}px`,  // ❌ 缺少 HEADER_HEIGHT
    height: `${height}px`,
  }
}
```

**问题**: `calculateTaskPosition` 返回的 `top` 从 0 开始，但任务区域顶部有 40px 的空白区域

### 2. 拖拽时间计算不精准

**位置**:

- 日视图 `DayView.vue` 第 34-62 行
- 周视图 `WeekView.vue` 第 61-92 行

```typescript
// 当前代码（不精准）
const relativeY = y - HEADER_HEIGHT + scrollTop
const newStartHour = Math.floor(relativeY / HOUR_HEIGHT)
const newStartTime = `${newStartHour.toString().padStart(2, '0')}:00`  // ❌ 分钟永远是 00
```

**问题**: 只精确到小时，未使用 `pixelsToTime` 函数支持 15 分钟粒度

### 3. 周视图常量冲突

**位置**: `src/components/calendar/WeekView.vue` 第 35-36 行

```typescript
const HOUR_HEIGHT = 60
const HEADER_HEIGHT = 60  // ❌ 覆盖了导入的 HEADER_HEIGHT = 40
```

### 4. 周/月视图表头对齐

- 周视图：flex 布局，表头和内容区使用相同的 `flex-1 min-w-[80px]`，理论上应对齐
- 月视图：使用 CSS Grid `grid-cols-7`，表头和内容应对齐

## 修复方案

### DayView.vue 修改

1. **任务位置**：`top` 加上 `HEADER_HEIGHT`
2. **拖拽时间**：使用 `pixelsToTime(relativeY)` 精确计算
3. **点击创建**：计算点击位置时减去 `HEADER_HEIGHT`

### WeekView.vue 修改

1. **移除本地常量定义**：使用导入的 `HOUR_HEIGHT` 和 `HEADER_HEIGHT`
2. **拖拽时间**：使用 `pixelsToTime` 精确计算
3. **表头对齐**：确保表头和内容区的列宽一致（使用相同的 `min-w-[80px]`）

### MonthView.vue 修改

- 表头已使用 `grid-cols-7`，与内容区一致，无需修改

## 目录结构

```
src/components/calendar/
├── DayView.vue     # [MODIFY] 修复任务位置、拖拽计算、点击创建
├── WeekView.vue    # [MODIFY] 清理常量、修复拖拽计算
└── MonthView.vue   # [CHECK] 确认表头对齐（可能无需修改）
```