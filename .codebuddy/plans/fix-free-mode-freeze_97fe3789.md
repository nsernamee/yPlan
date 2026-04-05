---
name: fix-free-mode-freeze
overview: 修复卡片拖动超过50px自动切换到free模式后卡住的问题：移除onMove2D中free模式的early return，让卡片在free模式下也继续更新视觉位置；同时确保DayView不需要free模式的跨列拖拽功能。
todos:
  - id: fix-free-mode-return
    content: 删除 TaskSlider.vue 第114行 `if (dragMode.value !== 'grid') return` 守卫，让视觉更新在 free 模式下也生效
    status: completed
  - id: verify-lint-free
    content: lint 检查确认零错误
    status: completed
    dependencies:
      - fix-free-mode-return
---

## 产品概述

修复日历卡片拖动超过50px后"卡住"不跟手的根本问题：`onMove2D` 中存在 `if (dragMode.value !== 'grid') return` 的模式守卫，当拖动距离超过50px自动切换到 free 模式后，该守卫导致卡片 transform 停止更新。

## 核心功能

- 移除 TaskSlider.vue onMove2D 中的 free 模式 early return，使视觉层更新在 grid/free 模式下始终生效
- 确保拖动过程中卡片始终跟随鼠标移动

## 技术栈

- Vue 3 + TypeScript + Composition API（现有项目）
- 目标文件：`src/components/task/TaskSlider.vue`

## 实现方案

### 根因定位

**文件**: `src/components/task/TaskSlider.vue:113-114`

```typescript
onMove2D: (offset) => {
  if (dragMode.value !== 'grid') return   // ← 问题所在：free模式下跳过所有视觉更新
```

**触发链**:

1. `handlePointerDown` 传入 `allowAutoSwitchToFree: true`
2. `useDrag.ts:120` — 拖动距离 >50px 时自动切到 free 模式
3. `onMove2D` 遇到模式守卫 → **直接 return** → `el.style.transform` 不再更新
4. 原卡片冻结 + DragPreview 浮动卡片出现 → 用户感知"卡住"

### 修改策略

**仅一处改动**: 删除第114行的 early return 守卫

```typescript
// 修改前
onMove2D: (offset) => {
  if (dragMode.value !== 'grid') return   // 删除此行
  
// 修改后
onMove2D: (offset) => {
  // 视觉层在 grid/free 模式下都需要实时更新（卡片必须跟随鼠标）
```

### 安全性分析

- **视觉层**(transform/top/height): 任何模式下都必须实时响应——用户需要看到卡片跟着鼠标
- **数据保存层**(onEnd2D): 已有独立分支处理——grid 模式保存时间变更、free 模式 emit drag-end 触发跨日期移动，不受影响
- resize 操作同理: 无论什么模式都需要实时预览拉伸效果

### 影响范围

- 仅修改 TaskSlider.vue 一行删除
- 不影响 WeekView 跨日期拖拽功能
- 不影响 DayView 时间轴内正常拖拽