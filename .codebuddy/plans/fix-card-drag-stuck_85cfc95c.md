---
name: fix-card-drag-stuck
overview: 修复卡片拖动卡住问题：统一使用 calculateTaskPosition 返回值作为移动限制基准（替代独立的 calculateDuration），确保像素级软限制与视觉效果一致；同时优化 onEnd2D 的数据保存流程避免状态不一致。
todos:
  - id: fix-drag-stuck
    content: 修复 TaskSlider.vue move 分支：用 calculateTaskPosition 返回的 height 替代独立计算的 durationPx
    status: completed
  - id: verify-lint
    content: lint 检查确认无新错误
    status: completed
    dependencies:
      - fix-drag-stuck
---

## Product Overview

修复日历卡片拖动时被"卡住"无法自由移动的问题，确保拖动软限制与视觉显示一致。

## Core Features

- 修复 TaskSlider.vue move 操作中 `durationPx` 与实际卡片视觉高度不一致导致的边界限制错误
- 确保所有越界时间数据（如旧数据 01:00~02:00）经过 clampTime 后的像素高度与限制计算统一

## Tech Stack

- Vue 3 + TypeScript（现有项目）
- 目标文件：`src/components/task/TaskSlider.vue`

## 实现方案

**根因分析**：move 分支中用 `calculateDuration()` 单独计算 `durationPx`，但 `calculateTaskPosition()` 内部先 clampTime 再算 height。当原始时间在 06:00 之前时，两者不一致——durationPx 远大于实际视觉高度，导致下界限制 `maxPx - durationPx` 过小，白白损失可移动空间。

**修复策略**：移除独立的 `calculateDuration` 和 `durationPx` 计算，直接复用 `calculateTaskPosition()` 返回的 `height` 值作为卡片实际高度进行边界限制。

### 关键修改点

文件：`src/components/task/TaskSlider.vue` 第119-138行

将：

```typescript
const duration = calculateDuration(props.schedule.startTime, props.schedule.endTime)
const startPos = calculateTaskPosition(props.schedule.startTime, props.schedule.endTime)
const durationPx = duration * (HOUR_HEIGHT / 60)
// ... newY + durationPx > maxPx → newY = maxPx - durationPx
```

改为：

```typescript
const { top: startTop, height: cardHeight } = calculateTaskPosition(props.schedule.startTime, props.schedule.endTime)
// ... newY + cardHeight > maxPx → newY = maxPx - cardHeight
```

### 注意事项

- `calculateTaskPosition` 内部已包含 clampTime 逻辑，返回值始终与视觉一致
- previewTime 预览逻辑保持不变（它调用 offsetTime→clampTime 是正确的，只影响气泡/虚线显示）