---
name: fix-drag-and-background
overview: 修复拖拽无法工作和背景变暗的问题
todos:
  - id: fix-drag
    content: 修复拖拽功能，拖拽结束后关闭窗口
    status: completed
  - id: remove-mask
    content: 移除暗色遮罩背景
    status: completed
---

## 用户需求

1. **拖拽功能修复**：任务列表弹出窗口中的任务无法拖拽，拖拽时背景日历在动
2. **移除暗色遮罩**：列表弹出时背景变暗，用户不想要这个效果

## 问题分析

1. **拖拽失败原因**：`handleDragStart` 函数中立即调用了 `emit('close')` 关闭窗口，导致拖拽元素在拖拽开始时就消失了
2. **背景暗原因**：第83行遮罩层有 `bg-black/20 dark:bg-black/40` 样式

## 解决方案

1. 移除 `handleDragStart` 中的 `emit('close')`
2. 添加 `@dragend` 事件，在拖拽**结束后**再关闭窗口
3. 移除遮罩层的暗色背景（改为透明）

## 技术方案

### 修改文件

```
src/components/task/TaskListDrawer.vue  # [MODIFY] 修复拖拽和遮罩
```

### 修改内容

#### 1. 修复拖拽功能

**修改前：**

```typescript
function handleDragStart(task: Task, event: DragEvent) {
  // ...
  emit('close')  // 立即关闭，导致拖拽失败
}
```

**修改后：**

```typescript
function handleDragStart(task: Task, event: DragEvent) {
  // ...
  // 不再立即关闭，等拖拽结束再关闭
}

function handleDragEnd() {
  emit('close')  // 拖拽结束后关闭
}
```

在任务元素上添加 `@dragend="handleDragEnd"`

#### 2. 移除暗色遮罩

**修改前：**

```html
<div class="fixed inset-0 bg-black/20 dark:bg-black/40 z-40">
```

**修改后：**

```html
<div class="fixed inset-0 z-40">
```