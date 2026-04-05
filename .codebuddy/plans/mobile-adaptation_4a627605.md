---
name: mobile-adaptation
overview: 为 yPlan 项目添加移动端和平板适配，包括任务列表抽屉、触摸交互优化、面板适配、周视图优化等，不影响桌面端功能。
todos:
  - id: create-drawer
    content: 创建 TaskListDrawer.vue 抽屉组件
    status: completed
  - id: add-fab
    content: HomeView 添加浮动按钮和抽屉集成
    status: completed
    dependencies:
      - create-drawer
  - id: adapt-panel
    content: TaskPanel 移动端面板宽度适配
    status: completed
  - id: optimize-touch
    content: TaskSlider 触摸区域增大
    status: completed
  - id: adjust-font-size
    content: 日历视图移动端字号调整
    status: completed
  - id: optimize-week
    content: 周视图移动端滚动优化
    status: completed
---

## 产品概述

为 yPlan 日历应用添加移动端（手机和平板）适配，确保在不同设备上都有良好的用户体验。

## 核心功能

- 移动端任务列表抽屉：通过浮动按钮打开，抽屉宽度适中方便拖拽任务到日历
- 触摸交互优化：增大触摸目标尺寸，优化手势交互
- 面板适配：编辑面板在移动端适配屏幕宽度
- 字体和间距调整：移动端字号和间距适当增大
- 周视图优化：改善移动端横向滚动体验
- 保持电脑端现有功能不受影响

## 技术方案

### 1. 任务列表抽屉（移动端）

创建 `TaskListDrawer.vue` 组件：

- 从右侧滑出，使用 CSS transform 动画
- 宽度：`min(280px, 80vw)`，适合拖拽操作
- 磨砂玻璃背景效果
- 支持点击遮罩关闭
- 复用现有 TaskList 组件内容

浮动按钮：

- 固定在右下角，距离底部导航顶部 16px
- 显示任务数量徽章
- 仅在移动端显示（`md:hidden`）

### 2. 触摸交互优化

- TaskSlider 调整手柄高度：3px → 16px（移动端）
- 时间刻度字号：text-xs → text-sm（移动端）
- 增加 touch-action: none 防止滚动冲突

### 3. 面板适配（TaskPanel.vue）

- 移动端：`inset-x-4 max-w-[calc(100vw-32px)]`
- 桌面端：保持原样 `w-96`
- 使用响应式类区分

### 4. 周视图优化

- 添加横向滚动提示
- 优化滚动体验
- 可选：显示当前日期前后各 2 天

### 5. 实现原则

- 使用 Tailwind CSS 响应式断点（md: 768px）
- 不修改桌面端现有样式
- 渐进增强，移动端优先

## 修改文件列表

```
d:/repository/yPlan/src/
├── components/
│   └── task/
│       └── TaskListDrawer.vue  # [NEW] 移动端任务列表抽屉组件
├── views/
│   └── HomeView.vue            # [MODIFY] 添加浮动按钮和抽屉逻辑
├── components/
│   ├── task/
│   │   ├── TaskPanel.vue       # [MODIFY] 移动端面板宽度适配
│   │   └── TaskSlider.vue      # [MODIFY] 移动端触摸区域增大
│   └── calendar/
│       ├── DayView.vue         # [MODIFY] 移动端字号调整
│       ├── WeekView.vue        # [MODIFY] 移动端滚动优化
│       └── MonthView.vue       # [MODIFY] 移动端样式适配
```