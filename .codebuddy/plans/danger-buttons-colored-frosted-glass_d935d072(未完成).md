---
name: danger-buttons-colored-frosted-glass
overview: 将 TaskPanel 中「移除此日程」和「删除任务」按钮的背景从白色磨砂改为使用任务对应颜色的磨砂玻璃质感
todos:
  - id: add-delete-btn-styles
    content: 在 TaskPanel.vue script 中新增 deleteBtnStyle 计算属性，返回移除/删除按钮的颜色样式对象
    status: completed
  - id: update-remove-schedule-btn
    content: 将「移除此日程」按钮改为绑定 deleteBtnStyle.removeSchedule 动态样式，保留磨砂玻璃动效
    status: completed
    dependencies:
      - add-delete-btn-styles
  - id: update-delete-task-btn
    content: 将两个场景下的「删除任务/删除」按钮统一绑定 deleteBtnStyle.deleteTask 动态样式
    status: completed
    dependencies:
      - add-delete-btn-styles
---

## 产品概述

将编辑面板（TaskPanel）底部「移除此日程」和「删除任务」两个危险操作按钮的背景从当前的白色磨砂玻璃改为**任务对应颜色的磨砂玻璃质感**，保持与日程卡片一致的视觉风格。

## 核心功能

- 「移除此日程」按钮：背景使用橙色系（`#ED7B2F`）的半透明磨砂玻璃
- 「删除任务」按钮：背景使用红色系（`#E34D59`）的半透明磨砂玻璃
- 两个按钮都保留 `backdrop-blur-xl`、圆角 `rounded-2xl`、阴影层次和 `active:scale-[0.97]` 微缩动效
- 深色模式适配：暗色下颜色稍亮，保持可读性

## 技术栈

- Vue 3 + TypeScript + Tailwind CSS
- 目标文件：`src/components/task/TaskPanel.vue`
- 颜色参考：`tailwind.config.js` 中定义的 `task.*` 颜色值

## 实现方案

### 核心策略：动态 style 绑定 + 静态 Tailwind 类分离

由于 Tailwind JIT 无法识别动态拼接的类名（如 `` `bg-task-${color}/15` ``），采用 **静态 Tailwind 类负责结构效果，动态 style 负责颜色** 的方式：

1. 新增计算属性 `deleteBtnStyle`，返回包含 `backgroundColor` 和 `borderColor` 的内联样式对象

- 使用 `task.orange`（`#ED7B2F`）作为「移除此日程」的底色，透明度 12%~15%
- 使用 `task.red`（`#E34D59`）作为「删除任务」的底色，透明度 12%~15%
- 边框对应颜色的 30% 透明度

2. 按钮样式改造：

- 移除固定 `bg-white/70` 和硬编码边框色
- 改为动态绑定 `:style` 对象覆盖背景和边框
- 保留所有磨砂玻璃效果类：`backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-md active:scale-[0.97]`

### 颜色映射

| 按钮 | 底色 | 背景 alpha | 边框 alpha | 文字色 |
| --- | --- | --- | --- | --- |
| 移除此日程 | #ED7B2F (orange) | 0.13 | 0.35 | orange-600 |
| 删除任务 | #E34D59 (red) | 0.13 | 0.35 | red-600 |


### 深色模式适配

- 深色模式下背景 alpha 提升至 ~0.18，文字使用 lighter 变体
- 通过 Tailwind `dark:` 前缀处理文字色变化即可