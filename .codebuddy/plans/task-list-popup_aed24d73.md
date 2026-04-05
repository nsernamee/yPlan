---
name: task-list-popup
overview: 将任务列表抽屉改为右下角弹出小窗口，支持限高滚动和拖拽自动关闭
design:
  architecture:
    framework: vue
  styleKeywords:
    - Glassmorphism
    - Apple HIG
    - Minimalism
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 12px
      weight: 400
    body:
      size: 14px
      weight: 500
  colorSystem:
    primary:
      - "#0052D9"
    background:
      - "#FFFFFF"
      - "#F3F4F6"
    text:
      - "#1F1F1F"
      - "#4B5563"
    functional:
      - "#00A870"
      - "#E34D59"
todos:
  - id: modify-layout
    content: 修改窗口布局为右下角弹出样式
    status: completed
  - id: add-scroll
    content: 添加限高和滚动支持
    status: completed
    dependencies:
      - modify-layout
  - id: add-drag-close
    content: 拖拽开始时自动关闭窗口
    status: completed
    dependencies:
      - modify-layout
  - id: update-animation
    content: 更新弹出动画为缩放效果
    status: completed
    dependencies:
      - modify-layout
---

## 用户需求

将移动端任务列表从右侧抽屉改为右下角弹出小窗口，具体要求：

1. **弹出窗口样式**：从右下角弹出，不是从右侧滑出的抽屉
2. **限高滚动**：窗口设置最大高度，任务列表超过高度时使用滚动方式
3. **拖拽自动关闭**：从窗口中选中任务开始拖动后，窗口自动关闭，方便拖动到日历视图
4. **符合设计规范**：遵循项目的磨砂玻璃、圆角、阴影、动画等设计标准

## 核心功能

- 点击底部导航"任务列表"打开窗口
- 点击窗口外部或关闭按钮关闭窗口
- 任务列表可滚动（超过最大高度时）
- 拖拽任务时窗口自动关闭
- 点击任务打开编辑面板

## 技术方案

### 修改文件

```
src/components/task/TaskListDrawer.vue  # [MODIFY] 改为弹出窗口样式
```

### 实现细节

#### 1. 布局修改

**原布局**：右侧全高抽屉

```html
<div class="absolute right-0 top-0 bottom-0 w-[min(280px,80vw)]">
```

**新布局**：右下角弹出窗口

```html
<div class="fixed right-4 bottom-20 w-[min(320px,calc(100vw-32px))] max-h-[60vh]">
```

#### 2. 窗口规格

| 属性 | 值 | 说明 |
| --- | --- | --- |
| 位置 | `right-4 bottom-20` | 距右16px，底部导航上方 |
| 宽度 | `min(320px, calc(100vw-32px))` | 最大320px |
| 最大高度 | `max-h-[60vh]` | 屏幕高度60% |
| 圆角 | `rounded-2xl` | 16px |
| 背景 | 磨砂玻璃 | `bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl` |
| 阴影 | `shadow-2xl` | 浮起效果 |


#### 3. 动画修改

**原动画**：从右侧滑入

```css
.slide-enter-from { transform: translateX(100%); }
```

**新动画**：缩放弹入（符合设计规范 scaleIn）

```css
.pop-enter-from { transform: scale(0.9); opacity: 0; }
.pop-enter-active { transition: all 0.15s ease-out; }
```

#### 4. 拖拽自动关闭

在 `handleDragStart` 函数中添加：

```typescript
function handleDragStart(task: Task, event: DragEvent) {
  // ... 原有逻辑
  emit('close')  // 开始拖拽后关闭窗口
}
```

#### 5. 滚动实现

窗口内容区设置：

```html
<div class="flex-1 overflow-y-auto max-h-[calc(60vh-60px)] scrollbar-thin">
```

### 交互流程

```
点击底部导航"任务列表"
    ↓
弹出窗口（scaleIn动画）
    ↓
┌──────────────────────────────┐
│ 用户操作：                     │
│                              │
│ 1. 拖拽任务 → 窗口关闭 → 拖放到日历 │
│ 2. 点击任务 → 编辑面板打开       │
│ 3. 点击外部 → 窗口关闭          │
│ 4. 点击X按钮 → 窗口关闭         │
└──────────────────────────────┘
```

## 设计方案

### 窗口位置示意

```
┌─────────────────────────────┐
│                             │
│      日历视图区域            │
│                             │
│                    ┌────────┴─────┐
│                    │ 任务列表  ✕   │
│                    │              │
│                    │ [任务1]      │
│                    │ [任务2]      │
│                    │ [任务3]      │
│                    │    ↕ 滚动    │
├────────────────────┴──────────────┤
│  日视图  周视图  月视图  任务列表   │
└───────────────────────────────────┘
```

### 视觉效果

- **磨砂玻璃背景**：`bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl`
- **圆角**：`rounded-2xl` (16px)，符合面板规范
- **阴影**：`shadow-2xl`，增加浮起感
- **边框**：`border border-gray-200/50 dark:border-gray-700/50`
- **动画**：0.15s 缩放弹入，符合设计规范的 scaleIn 动画

### 交互反馈

| 操作 | 视觉反馈 |
| --- | --- |
| 任务悬停 | `hover:shadow-md hover:border-gray-300` |
| 任务按下 | `active:scale-[0.98]` |
| 窗口弹出 | 缩放弹入 0.15s |
| 窗口关闭 | 快速淡出 0.1s |