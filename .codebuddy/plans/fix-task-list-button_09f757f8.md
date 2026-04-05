---
name: fix-task-list-button
overview: 修复底部导航栏任务列表按钮点击无效问题，并删除右下角悬浮按钮
todos:
  - id: add-store-state
    content: 在 view store 添加抽屉状态和方法
    status: completed
  - id: fix-bottom-nav
    content: 修改 BottomNav 点击逻辑打开抽屉
    status: completed
    dependencies:
      - add-store-state
  - id: remove-fab
    content: 删除 HomeView 浮动按钮，使用 store 状态
    status: completed
    dependencies:
      - add-store-state
---

## 用户需求

1. 底部导航栏的"任务列表"点击无法打开抽屉
2. 删除屏幕右下角的悬浮按钮

## 问题分析

- BottomNav.vue 第25行 `@click="tab.key !== 'list' && switchView(tab.key)"` 导致点击 list 时无任何动作
- HomeView.vue 中的 `showTaskDrawer` 状态是局部状态，BottomNav 无法访问
- 需要将抽屉状态提升到 store 实现跨组件通信

## 技术方案

### 1. 在 view store 添加抽屉状态

在 `src/stores/view.ts` 中添加：

- `showTaskDrawer` ref 状态
- `openTaskDrawer()` 方法
- `closeTaskDrawer()` 方法

### 2. 修改 BottomNav.vue

- 点击"任务列表"时调用 `viewStore.openTaskDrawer()`
- 移除 `tab.key !== 'list'` 的判断

### 3. 修改 HomeView.vue

- 删除浮动按钮（第64-77行）
- 删除局部 `showTaskDrawer`、`openTaskDrawer`、`closeTaskDrawer`、`taskCount`
- 抽屉使用 store 中的状态

### 修改文件

```
src/stores/view.ts          # [MODIFY] 添加抽屉状态和方法
src/components/layout/BottomNav.vue  # [MODIFY] 点击任务列表打开抽屉
src/views/HomeView.vue      # [MODIFY] 删除浮动按钮，使用 store 状态
```