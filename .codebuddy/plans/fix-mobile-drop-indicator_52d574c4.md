---
name: fix-mobile-drop-indicator
overview: 减小 LIST_DRAG_OFFSET 常量从 40px 到 22px，修复手机端列表拖入时虚线位置过靠上的问题
todos:
  - id: fix-list-drag-offset
    content: 修改 constants.ts 中 LIST_DRAG_OFFSET 从 40 改为 22，并更新注释说明兼顾桌面端和移动端的视觉效果
    status: completed
  - id: update-drop-indicator-comment
    content: 更新 DropIndicator.vue 第16-17行的注释以反映新偏移值
    status: completed
    dependencies:
      - fix-list-drag-offset
---

## 产品概述

修复手机端从任务列表拖入日历时，蓝色 DropIndicator 虚线位置过于靠上、与 DragPreview 预览卡片之间视觉脱节明显的问题。

## 核心功能

- 调整 `LIST_DRAG_OFFSET` 常量值，使虚线在桌面端（有 ghost image）和移动端（仅 DragPreview 卡片）两种场景下的视觉效果都合理
- 确保气泡显示时间（displayTime）同步修正

## 技术栈

- Vue 3 Composition API + TypeScript
- 常量驱动：`LIST_DRAG_OFFSET` 在 `constants.ts` 定义一处，`DropIndicator.vue` 和 `WeekView.vue`/`DayView.vue` 的 `getEffectiveStartTime()` 引用

## 实现方案

### 问题根因

| 参数 | 桌面端(有 ghost image) | 移动端(仅 DragPreview) |
| --- | --- | --- |
| `LIST_DRAG_OFFSET = 40px` | 虚线在 ghost 上方 ✅ | 虚线距卡片顶部 ~26px ❌ 脱节 |


DragPreview 定位参数：

- 卡片尺寸 180×60px
- `DRAG_OFFSET_Y = 16px`
- `transform: translate(-50%, -50%)` → 卡片顶部 ≈ fingerY - 14px

### 解决方案

将 `LIST_DRAG_OFFSET` 从 **40** 减小到 **22**：

| 偏移 | 桌面端 | 移动端 |
| --- | --- | --- |
| **22px** | 仍在 ghost 视觉区域内 ✅ | 距卡片顶部 ~8px，刚好在上方 ✅ |


22px 选型依据：桌面端 ghost image 通常紧贴光标下方几像素，22px 偏移仍能保持虚线在 ghost 区域内；移动端 DragPreview 卡片顶部(fingerY-14) 与虚线(fingerY-22) 仅差约 8px，视觉上虚线紧贴卡片顶部。

### 影响范围（自动联动）

1. `DropIndicator.vue` 第27行：`position -= LIST_DRAG_OFFSET` — yPosition 自动生效
2. `DropIndicator.vue` 第19行：`offsetMinutes = Math.round(LIST_DRAG_OFFSET / (HOUR_HEIGHT / 60))` — displayTime 气泡时间自动修正（40→22，约减少18分钟偏移）
3. `WeekView.vue` / `DayView.vue` 的 `getEffectiveStartTime()` — 使用相同的 offsetMinutes 计算逻辑（各自内联计算），需确认一致性

### 涉及文件

```
src/utils/constants.ts           # [MODIFY] LIST_DRAG_OFFSET: 40 → 22 + 更新注释
src/components/common/DropIndicator.vue  # [MODIFY] 第16-17行注释更新
```

### 注意事项

- `getEffectiveStartTime()` 在 WeekView(第156行) 和 DayView 中各有一份内联实现，使用 `Math.round(LIST_DRAG_OFFSET / (HOUR_HEIGHT / 60))` 计算 offsetMinutes。由于引用的是同一个常量，常量修改后两处自动联动，无需额外改动。
- DropIndicator 注释第16-17行描述了旧的40px逻辑，需同步更新。