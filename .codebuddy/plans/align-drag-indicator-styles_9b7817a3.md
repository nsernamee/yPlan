---
name: align-drag-indicator-styles
overview: 对齐"日历上直接拖动"和"从列表拖入日历"两种模式的 DropIndicator 虚线指示器效果，使其视觉表现一致
design:
  architecture:
    framework: vue
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 32px
      weight: 600
    subheading:
      size: 18px
      weight: 500
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#618DFF"
todos:
  - id: align-drop-indicator
    content: 修改 DropIndicator 气泡位置从虚线上方改到下方
    status: completed
---

## Product Overview

对齐从任务列表拖入日历与在日历上直接拖动 TaskSlider 两种操作的 DropIndicator（虚线指示器）视觉效果，使其完全一致。

## Core Features

- 修改 DropIndicator 组件：将时间气泡位置从虚线上方改为虚线下方
- 确保两种拖动模式（列表拖入 vs 日历上拖动）显示效果一致
- 时间准确性不受影响：以虚线实际位置对应的时间为准

## 用户截图对比分析

- **图1 - 日历上直接拖动**：指示线 + 气泡(13:50)在**线下方**
- **图2 - 从列表拖入**：虚线 + 气泡(12:08)在**线上方**
- 目标：让图2的效果变成和图1一样

## Tech Stack

- Vue 3 + TypeScript
- Tailwind CSS

## Implementation Approach

修改 `DropIndicator.vue` 模板中的气泡定位方式：

- 当前：气泡用 `absolute left-2 -top-6` 定位到虚线上方
- 改为：用 `absolute left-2 top-0.5 translate-y-full` 或类似方式定位到虚线下方
- 虚线本身保持不变，时间计算基于 yPosition 不受影响

这是一个纯 CSS 样式调整，不涉及逻辑变更。

仅修改 DropIndicator.vue 的模板样式，将时间气泡从虚线上方移至下方。