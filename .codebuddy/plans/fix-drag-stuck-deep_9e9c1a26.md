---
name: fix-drag-stuck-deep
overview: 深度修复卡片拖动卡住问题，包含三个层面的修改：(1) onEnd2D用像素位置直接反算时间替代offsetTime链式调用，消除视觉与数据不一致；(2) move分支在handlePointerDown时也记录originalTop/Height保持一致性；(3) 拖动预览时间使用pixelsToTime基于最终像素位置计算。
design:
  architecture:
    framework: vue
todos:
  - id: fix-move-save-logic
    content: 修复 TaskSlider.vue：新增 pixelsToTime 导入和 moveFinalPixelY 变量；onMove2D 记录最终像素、预览时间改用 pixelsToTime；onEnd2D 用 pixelsToTime 反算时间
    status: completed
  - id: verify-lint
    content: lint 检查确认零错误
    status: completed
    dependencies:
      - fix-move-save-logic
---

## 产品概述

修复日历卡片拖动释放后"卡住/跳回"的根本问题：onEnd2D 基于原始鼠标偏移量保存时间（与 onMove2D 像素限制后的视觉位置不一致），导致卡片从用户看到的底部位置跳回顶部边界。

## 核心功能

- 修复 move 操作的保存逻辑，使释放后卡片位置与拖动时的视觉效果完全一致
- 同时修复预览气泡/DropIndicator 时间显示与实际落点不匹配的问题

## 问题根因（已验证）

**核心矛盾链**：

1. `onMove2D` 将卡片像素限制到 `newY ∈ [minPx, maxPx - cardHeight]`（如限制在1020px处，约22:00位置）
2. `onEnd2D` 完全忽略此结果！它使用原始 `offset.y`（可能为+900px）调用 `offsetToMinutes(900) = 900分钟`
3. `offsetTime('09:00', 900) = '次日00:00'` → `clampTime() = '06:00'`
4. **保存为 06:00~07:00，但用户看到卡片在22:00位置 → 释放即跳变**

这就是"卡住"的真实原因——不是不能拖动，而是每次释放后都跳回边界。

## 技术栈

- Vue 3 + TypeScript + Composition API（现有项目）
- 目标文件：`src/components/task/TaskSlider.vue`

## 实现方案

### 核心策略：onEnd2D 基于最终像素位置用 pixelsToTime 反算时间

**不再使用 `offsetToMinutes(offset.y) + offsetTime()` 链式调用**，改为：

1. 在 `handlePointerDown` 作用域新增闭包变量 `let moveFinalPixelY = 0`
2. `onMove2D` move 分支末尾记录钳位后的最终像素位置 `moveFinalPixelY = newY`
3. 预览时间改为基于最终像素反算：`pixelsToTime(newY)`
4. `onEnd2D` move 分支改为：`newStart = clampTime(pixelsToTime(moveFinalPixelY))`

这样保存的时间始终是用户眼睛看到的卡片所在位置对应的时间。

### 具体修改点

| 位置 | 改动 |
| --- | --- |
| 第9行 import | 新增导入 `pixelsToTime` |
| 第51行附近 | 新增 `let moveFinalPixelY = 0` 变量 |
| 第135行后 | 添加 `moveFinalPixelY = newY` 记录最终像素 |
| 第137-139行 | 预览时间改用 `pixelsToTime(newY)` |
| 第210-219行 | onEnd2D move 分支改用 `pixelsToTime(moveFinalPixelY)` |


### 注意事项

- `calculateDuration(props.schedule.startTime, props.schedule.endTime)` 用于保持原始持续时间仍然正确，因为它是基于真实时间差计算的
- resize-start/end 操作不受影响（它们用的是 originalTop/originalHeight 的像素偏移，与自身逻辑一致）

本任务不涉及UI创建或重大界面改造，仅修复现有组件的逻辑bug。