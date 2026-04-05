---
name: fix-indicator-time-mismatch
overview: 修复 DropIndicator 虚线上移后时间气泡与日历时间不一致的问题
todos:
  - id: fix-display-time
    content: 添加 displayTime 计算属性使气泡时间匹配虚线实际位置
    status: completed
---

## 产品概述

修复从列表拖入日历时 DropIndicator 虚线指示器的气泡时间与虚线实际位置不匹配的问题。

## 核心功能

- 当前状态：虚线位置正确（在预览块上方），但气泡显示的时间（如 15:20）与虚线实际所在的日历时间（如 14:50）不一致
- 需要在向上偏移 Y 坐标的同时，根据偏移量反算出虚线真实位置对应的时间，用于气泡显示

## 技术栈

- Vue 3 + TypeScript
- Tailwind CSS

## 实现方案

修改 `DropIndicator.vue`，新增 `displayTime` 计算属性：

- **非列表拖入**：直接使用 `props.time`
- **列表拖入时**：根据 `LIST_DRAG_OFFSET` 反算出偏移后的时间

### 关键公式

```
offsetMinutes = LIST_DRAG_OFFSET / (HOUR_HEIGHT / 60)  // 40px 对应的分钟数
新时间 = 原始时间 - offsetMinutes                        // 向上偏移对应更早的时间
```

例如 HOUR_HEIGHT=80px 时，offsetMinutes = 40/(80/60) = 30分钟，所以 15:20 - 30min = 14:50

### 模板变更

- 将模板中 `{{ time }}` 改为 `{{ displayTime }}`

## 修改文件

- `src/components/common/DropIndicator.vue` — 新增 displayTime 计算属性并替换模板引用