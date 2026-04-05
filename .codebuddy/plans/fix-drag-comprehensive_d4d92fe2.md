---
name: fix-drag-comprehensive
overview: 全面修复任务列表拖拽功能，包括桌面端和移动端
todos:
  - id: fix-dragend-timing
    content: 延迟关闭窗口，修复 handleDragEnd 和添加鼠标位置监听
    status: completed
  - id: fix-drag-preview
    content: 恢复 DragPreview 自定义预览显示
    status: completed
---

## 用户需求

修复任务列表的拖拽功能问题：

1. 桌面端没有原来的拖拽动画
2. 手机端无法拖拽
3. 长按选中后任务列表窗口消失，会直接拖动日历

## 问题分析

1. **过早关闭窗口**：`handleDragEnd` 在 `dragend` 事件时立即关闭窗口，导致任务元素消失，拖拽效果中断
2. **没有自定义预览**：DragPreview 排除了 `isDraggingFromList`，且 `startDragFromList` 没有设置 `currentPosition`
3. **移动端不支持**：HTML5 拖拽 API 在移动端支持有限，需要触摸事件支持

## 核心问题

- `TaskListDrawer.vue` 第65-67行：`handleDragEnd` 立即关闭窗口
- `DragPreview.vue` 第11行：排除了 `isDraggingFromList`
- `drag.ts` `startDragFromList`：没有设置 `currentPosition`

## 技术方案

### 修改文件

```
src/components/task/TaskListDrawer.vue  # 修复拖拽关闭时机，添加鼠标位置监听
src/components/common/DragPreview.vue   # 恢复自定义预览
src/stores/drag.ts                      # startDragFromList 设置初始位置
```

### 修改内容

#### 1. TaskListDrawer.vue 修改

**问题**：`handleDragEnd` 立即关闭窗口，导致拖拽中断

**解决方案**：

- 延迟关闭窗口，确保拖拽动画完成
- 添加全局 `mousemove` 监听更新预览位置
- 在 `dragstart` 时设置初始位置

```typescript
// 修改后的 handleDragStart
function handleDragStart(task: Task, event: DragEvent) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('text/plain', task.id)
  event.dataTransfer.effectAllowed = 'move'
  
  dragStore.startDragFromList(task)
  dragStore.updatePosition({ x: event.clientX, y: event.clientY })  // 设置初始位置
}

// 修改后的 handleDragEnd - 延迟关闭
function handleDragEnd() {
  setTimeout(() => {
    emit('close')
  }, 100)  // 延迟100ms关闭
}

// 添加全局鼠标移动监听
function handleGlobalMouseMove(event: MouseEvent) {
  if (dragStore.isDraggingFromList) {
    dragStore.updatePosition({ x: event.clientX, y: event.clientY })
  }
}
```

#### 2. DragPreview.vue 修改

**问题**：排除了 `isDraggingFromList` 导致不显示自定义预览

**解决方案**：移除该检查，让所有拖拽都显示自定义预览

```typescript
// 修改前
const showPreview = computed(() => {
  if (dragStore.isDraggingFromList) return false  // 移除这行
  return dragStore.isDragging && dragStore.isFreeDrag && dragStore.draggingTask
})

// 修改后
const showPreview = computed(() => {
  return dragStore.isDragging && dragStore.isFreeDrag && dragStore.draggingTask
})
```

#### 3. 移动端支持说明

HTML5 拖拽 API 在移动端支持有限。完整的移动端支持需要：

- 添加 `touchstart`、`touchmove`、`touchend` 事件监听
- 创建自定义触摸拖拽实现
- 这是一个较大的改动，建议作为后续优化