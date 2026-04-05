---
name: fix-drag-preview
overview: 修复从任务列表拖拽时的预览问题
todos:
  - id: fix-drag-preview
    content: 修改 DragPreview.vue 添加 isDraggingFromList 检查
    status: completed
---

## 问题分析

用户反馈拖拽功能存在以下问题：

1. 任务列表中的任务拖不动
2. 长按后列表会消失
3. 左上角出现磨砂玻璃长方形但没有任务内容

## 核心问题

通过代码分析发现：

1. `DragPreview.vue` 的 `showPreview` 计算属性没有检查 `isDraggingFromList`
2. `startDragFromList` 函数没有设置 `currentPosition`
3. `currentPosition` 初始值为 `{x:0, y:0}`，导致预览显示在左上角
4. 浏览器原生拖拽已经有拖拽图像，不需要额外显示自定义预览

## 解决方案

修改 `DragPreview.vue` 的 `showPreview` 计算属性，当 `isDraggingFromList` 为 `true` 时返回 `false`，使用浏览器原生拖拽图像代替自定义预览。

## 修改文件

```
src/components/common/DragPreview.vue  # [MODIFY] 添加 isDraggingFromList 检查
```

## 修改内容

**修改前：**

```javascript
const showPreview = computed(() => {
  const result = dragStore.isDragging && dragStore.isFreeDrag && dragStore.draggingTask
  console.log('DragPreview showPreview', {
    isDragging: dragStore.isDragging,
    isFreeDrag: dragStore.isFreeDrag,
    dragMode: dragStore.dragMode,
    hasDraggingTask: !!dragStore.draggingTask,
    result
  })
  return result
})
```

**修改后：**

```javascript
const showPreview = computed(() => {
  // 从任务列表拖拽时，使用浏览器原生拖拽图像，不显示自定义预览
  if (dragStore.isDraggingFromList) return false
  
  const result = dragStore.isDragging && dragStore.isFreeDrag && dragStore.draggingTask
  console.log('DragPreview showPreview', {
    isDragging: dragStore.isDragging,
    isFreeDrag: dragStore.isFreeDrag,
    isDraggingFromList: dragStore.isDraggingFromList,
    dragMode: dragStore.dragMode,
    hasDraggingTask: !!dragStore.draggingTask,
    result
  })
  return result
})
```

## 技术原理

1. **浏览器原生拖拽图像**：HTML5 拖拽 API 会自动创建被拖拽元素的半透明副本作为拖拽图像
2. **自定义预览冲突**：自定义预览位置计算依赖 `currentPosition`，但 `startDragFromList` 没有设置这个值
3. **解决方案**：从任务列表拖拽时，不显示自定义预览，使用浏览器原生拖拽图像