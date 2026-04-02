---
name: 修复拖拽预览位置不一致问题
overview: 统一拖拽预览和实际释放的时间计算逻辑，简化 DropIndicator 只显示开始时间虚线
todos:
  - id: fix-dayview-time
    content: 修改 DayView.vue 使用 dragStore.targetTime
    status: completed
  - id: fix-weekview-time
    content: 修改 WeekView.vue 使用 dragStore.targetTime
    status: completed
  - id: simplify-indicator
    content: 简化 DropIndicator.vue 只显示虚线
    status: completed
---

## 用户需求

1. **位置不一致**：拖拽释放时实际位置和虚线提示位置不一样
2. **简化显示**：只需要开始时间的一条虚线，不需要时间标签和半透明区域

## 问题根源

### 位置不一致的原因

**TaskSlider.vue onMove2D**：

```typescript
const deltaMinutes = offsetToMinutes(offset.y)
const newStartTime = offsetTime(props.task.startTime, deltaMinutes)
dragStore.setTargetTime(newStartTime)
```

- 虚线显示的时间 = 任务原始开始时间 + 偏移量

**DayView.vue handleTaskDragEnd**：

```typescript
const relativeY = y - (containerRect?.top || 0) + scrollTop - HEADER_HEIGHT
const newStartTime = pixelsToTime(Math.max(0, relativeY))
```

- 实际释放的时间 = 鼠标绝对位置转时间

**问题**：两种计算方式结果不一致！

### DropIndicator 显示过多

当前显示：虚线 + 时间标签 + 半透明区域
用户需要：只保留虚线

## 解决方案

### 1. 统一时间计算

**DayView 和 WeekView** 的 `handleTaskDragEnd` 直接使用 `dragStore.targetTime`，不再重新计算

**修改前**：

```typescript
const newStartTime = pixelsToTime(Math.max(0, relativeY))
```

**修改后**：

```typescript
const newStartTime = dragStore.targetTime || props.task.startTime
```

### 2. 简化 DropIndicator

只保留虚线，移除时间标签和半透明区域

## 目录结构

```
src/components/
├── common/
│   └── DropIndicator.vue  # [MODIFY] 简化显示，只保留虚线
└── calendar/
    ├── DayView.vue        # [MODIFY] 使用 targetTime
    └── WeekView.vue       # [MODIFY] 使用 targetTime
```