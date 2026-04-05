---
name: fix-inversion-and-simplify-time
overview: 两件事：(1) 将时间轴结束时间简化为显式的23:59，调整constants和time.ts中所有相关常量和钳位逻辑；(2) 修复free模式下拖动保存的边界反转问题——统一grid和free模式的保存路径。
design:
  architecture:
    framework: vue
todos:
  - id: fix-constants-time
    content: 修改 constants.ts(TIME_END_HOUR=23, TIME_AXIS_HOURS公式)和time.ts(clampTime简化+pixelsToTime加clamp)
    status: completed
  - id: fix-taskslider-free
    content: "修改 TaskSlider.vue: free模式移除提前return，走统一保存路径后再emit"
    status: completed
    dependencies:
      - fix-constants-time
  - id: fix-dayview-weekview-dropindicator
    content: 同步更新 DayView/WeekView/DropIndicator 中所有 TIME_END_HOUR-1 引用为 TIME_END_HOUR
    status: completed
    dependencies:
      - fix-constants-time
  - id: verify-lint-all
    content: 全量 lint 检查确认零错误
    status: completed
    dependencies:
      - fix-constants-time
      - fix-taskslider-free
      - fix-dayview-weekview-dropindicator
---

## Product Overview

修复日历卡片向下拖动时的上下边界反转问题，并将时间轴结束时间从隐式的 `TIME_END_HOUR=24`(实际表示23:59) 改为显式的 `TIME_END_HOUR=23`，简化所有边界判断逻辑。

## Core Features

- **TIME_END_HOUR 24→23**：常量值直接对应真实结束小时，消除所有 `(TIME_END_HOUR-1)` 绕弯写法
- **pixelsToTime clamp 保护**：防止超范围像素产生非法时间（如 '24:00'、'25:30'）
- **free 模式统一保存路径**：free 模式不再跳过时间计算，与 grid 模式走同一套 `pixelsToTime + clampTime` 保存链路
- **6个文件同步更新**：constants.ts、time.ts、TaskSlider.vue、DayView.vue、WeekView.vue、DropIndicator.vue

## Tech Stack

- Vue 3 + TypeScript + Composition API（现有项目）
- 目标文件：constants.ts, time.ts, TaskSlider.vue, DayView.vue, WeekView.vue, DropIndicator.vue

## Implementation Approach

### 核心策略：显式边界 + 统一链路 + clamp 防御

**策略1 — 常量语义化**：`TIME_END_HOUR` 从 24（"不含24点"）改为 23（"包含23点59分"），`TIME_AXIS_HOURS = END - START + 1`

**策略2 — pixelsToTime 加 clamp**：输出前钳位到 `[360, 1439]`，杜绝非法时间进入后续链路

**策略3 — free 模式统一保存**：移除 free 模式的提前 return，先保存时间再 emit 通知父组件

### 关键数据流（修复后）

```
拖动 → onMove2D(像素限制+记录moveFinalPixelY+设置targetTime)
     → onEnd2D:
       grid/free统一: pixelsToTime(moveFinalPixelY) → clampTime → 保存
       free额外: emit('drag-end')给父组件做跨日期处理
```

## Implementation Notes

### 文件改动清单

#### 1. constants.ts

- `TIME_END_HOUR`: 24 → 23
- `TIME_AXIS_HOURS`: `TIME_END_HOUR - TIME_START_HOUR` → `TIME_END_HOUR - TIME_START_HOUR + 1`

#### 2. time.ts

- `clampTime`: maxMin 从 `TIME_END_HOUR * 60 - 1` → `TIME_END_HOUR * 60 + 59`；上界返回从 `(TIME_END_HOUR-1):59` → `TIME_END_HOUR:59`
- `pixelsToTime`: 返回前加 clamp `Math.max(minMin, Math.min(maxMin, totalMinutes))`

#### 3. TaskSlider.vue

- `onEnd2D` move 分支：移除 `if (dragMode.value === 'free') { emit; return }` 提前返回
- 改为统一保存后，free 模式额外 emit

#### 4. DayView.vue (3处)

- 行89: `TIME_END_HOUR - 1` → `TIME_END_HOUR`
- 行145: `(TIME_END_HOUR - 1) * 60 + 59` → `TIME_END_HOUR * 60 + 59`

#### 5. WeekView.vue (2处)

- 行111: `TIME_END_HOUR - 1` → `TIME_END_HOUR`
- 行153: `(TIME_END_HOUR - 1) * 60 + 59` → `TIME_END_HOUR * 60 + 59`

#### 6. DropIndicator.vue (1处)

- 行39: `(TIME_END_HOUR - 1) * 60 + 59` → `TIME_END_HOUR * 60 + 59`