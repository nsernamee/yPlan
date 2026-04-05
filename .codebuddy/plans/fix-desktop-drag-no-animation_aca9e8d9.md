---
name: fix-desktop-drag-no-animation
overview: 修复桌面端 TaskList.vue 拖动时缺少 position 参数导致 DragPreview 气泡和 DropIndicator 虚线不显示的问题
todos:
  - id: fix-tasklist-drag
    content: 修复 TaskList.vue 的 handleDragStart 传入 position 参数并补全 RAF 轮询和 dragover 监听，使电脑端拖入时有气泡动画和虚线提示
    status: completed
---

## 产品概述

修复电脑端从任务列表（TaskList.vue）拖入日历时没有气泡动画和虚线提示的问题。

## 核心功能

- 电脑端从列表拖入时显示 DragPreview 气泡跟随鼠标
- 进入日历区域后显示 DropIndicator 虚线指示器
- 与移动端 TaskListDrawer 的拖动体验一致

## 根因分析

**TaskList.vue 第52行**：`dragStore.startDragFromList(task)` 缺少 `position` 参数，导致：

- `currentPosition` 为 undefined → DragPreview 无法定位
- 无 RAF 轮询机制 → 拖拽过程中位置不更新
- 无全局 dragover 监听器 → 鼠标位置无法被追踪

对比 TaskListDrawer.vue 已有完整实现：传入 position + RAF轮询 + dragover 监听。

## Tech Stack

- Vue 3 + TypeScript + Tailwind CSS
- HTML5 Drag & Drop API
- RAF (requestAnimationFrame) 轮询

## Implementation Approach

参照 TaskListDrawer.vue 的已验证实现，给 TaskList.vue 补全桌面端拖动所需的全部逻辑：

1. **handleDragStart** 传入 `{ x: event.clientX, y: event.clientY }` 作为初始 position
2. **添加 RAF 轮询变量**：rafId、currentMousePos、pollMousePosition、startPolling、stopPolling
3. **handleDragStart 中启动轮询**
4. **添加 handleDragEnd 停止轮询**
5. **添加全局 dragover 监听器** (onMounted/onUnmounted) 更新 currentMousePos

## 修改文件

- `src/components/task/TaskList.vue` — 补全 position 参数、RAF轮询、dragover监听