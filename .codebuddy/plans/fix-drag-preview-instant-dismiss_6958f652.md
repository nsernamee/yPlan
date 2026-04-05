---
name: fix-drag-preview-instant-dismiss
overview: 将 DragPreview 离开动画从 0.2s 缩短到接近 0，使取消拖动后气泡立即消失
todos:
  - id: fix-dismiss-delay
    content: 修改 DragPreview 离开动画时长为 0.05s 使气泡即时消失
    status: completed
---

## 产品概述

修复桌面端取消拖动后 DragPreview 气泡消失有延迟的问题，使其能立即消失。

## 核心功能

- 将 DragPreview 离开动画时长从 200ms 缩短至 50ms（人眼感知为瞬时消失）
- 保持进入动画不变（进入时的弹性动画体验是正向的）

## 技术栈

- Vue 3 `<Transition>` 组件动画控制
- CSS animation 时长调整

## 实现方案

修改 `src/components/common/DragPreview.vue` 第 136 行，将离开动画时长从 `0.2s` 改为 `0.05s`。

## 修改文件

```
src/components/common/DragPreview.vue   # [MODIFY] 将 .drag-preview-leave-active 动画时长 0.2s → 0.05s
```