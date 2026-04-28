---
name: optimize-drop-indicator-position
overview: 优化 DropIndicator 虚线位置，使日历上拖动已有日程时，虚线显示在拖动卡片上方而非紧贴卡片顶部。
todos:
  - id: add-offset-constant
    content: 在 constants.ts 新增 CALENDAR_DRAG_OFFSET 常量（值约为32px）
    status: completed
  - id: fix-indicator-position
    content: 修改 DropIndicator.vue 的 yPosition 计算逻辑，日历内拖动时应用向上偏移
    status: completed
    dependencies:
      - add-offset-constant
---

## 产品概述

优化日历视图中日程卡片拖动时的虚线(DropIndicator)显示位置。当前问题：当在日历内拖动一个时间段较长的日程时，虚线位置紧贴卡片顶部（或与卡片重叠），用户期望虚线显示在拖动卡片的上方一点，作为清晰的下放目标指示。

## 核心功能

- 调整 DropIndicator 组件的 yPosition 计算，使日历内部拖动场景下虚线也具有合理的向上偏移
- 确保 grid 模式和 free 模式下虚线都能正确显示在拖动卡片的上方
- 保持列表拖入场景的现有行为不变（已有 40px 偏移）

## 技术栈

- Vue 3 Composition API + TypeScript
- Pinia 状态管理 (dragStore)
- 现有常量体系 (LIST_DRAG_OFFSET, HOUR_HEIGHT 等)

## 实现方案

### 问题根因分析

当前 `DropIndicator.vue` 的 `yPosition` 计算逻辑：

- **列表拖入场景** (`isDraggingFromList=true`)：向上偏移 `LIST_DRAG_OFFSET`(40px)，效果正确
- **日历内部拖动场景** (`isDraggingFromList=false`)：偏移量为 0，虚线精确渲染在 `timeToPixels(targetTime)` 位置

而 `TaskSlider.vue` 在 move 操作中设置 `targetTime = pixelsToTime(newY)`，其中 `newY` 是卡片的**顶部像素位置**。因此虚线渲染在卡片顶部位置，对于长时段日程来说视觉上不理想。

### 解决方案

修改 `DropIndicator.vue` 的 `yPosition` 计算逻辑：

1. **非列表拖入场景也应用偏移**：当 `!isDraggingFromList` 且 `dragStore.isFreeDrag` 时（free 模式），应用一个较小的向上偏移（约 30-40px），使虚线显示在全局 DragPreview 卡片上方
2. **Grid 模式的处理**：grid 模式下原卡片通过 `transform: translateY(16px)` 跟随鼠标，虚线应在原位置的上方。由于卡片已有 16px 下偏移，给虚线加约 20-30px 向上偏移即可避免重叠

### 具体改动

统一为：非列表拖入场景下，当有目标时间时，统一施加一个合理的向上偏移量（如 32px），使虚线始终位于卡片视觉位置的上方。

```typescript
// DropIndicator.vue - yPosition computed
const yPosition = computed(() => {
  let position = timeToPixels(props.time)
  
  // 列表拖入：大偏移量（DragPreview 有较大下偏移+居中定位）
  if (dragStore.isDraggingFromList) {
    position -= LIST_DRAG_OFFSET  // 40px
  } else if (dragStore.isFreeDrag || dragStore.isGridDrag) {
    // 日历内部拖动：小偏移量，确保虚线在卡片视觉上方
    position -= CALENDAR_DRAG_OFFSET  // 新增常量，约 32px
  }
  
  return props.includeHeader ? HEADER_HEIGHT + position : position
})
```

### 涉及文件

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/utils/constants.ts` | [MODIFY] | 新增 `CALENDAR_DRAG_OFFSET` 常量 |
| `src/components/common/DropIndicator.vue` | [MODIFY] | yPosition 计算中增加日历内部拖动的偏移逻辑 |