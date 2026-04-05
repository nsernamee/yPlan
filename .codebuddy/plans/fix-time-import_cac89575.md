---
name: fix-time-import
overview: 修复 time.ts 缺少 TIME_AXIS_HOURS 导入导致的运行时崩溃：在 import 行补上 TIME_AXIS_HOURS。
todos:
  - id: fix-time-import
    content: 修复 time.ts 第2行 import 补充 TIME_AXIS_HOURS
    status: completed
  - id: verify-lint-time
    content: lint 检查确认零错误
    status: completed
    dependencies:
      - fix-time-import
---

## 产品概述

修复 `src/utils/time.ts` 导入缺失 `TIME_AXIS_HOURS` 常量导致的运行时崩溃，该错误导致 `calculateTaskPosition()` 抛出 ReferenceError，卡片无法渲染和拖动。

## 核心功能

- 修复第2行 import 语句，补全缺失的 `TIME_AXIS_HOURS` 常量
- 恢复卡片的正常渲染与拖动能力

## Tech Stack

- Vue 3 + TypeScript（现有项目）
- 目标文件：`src/utils/time.ts`

## 实现方案

### 根因

**文件**: `src/utils/time.ts:2`

```typescript
import { HOUR_HEIGHT, TIME_GRANULARITY, MIN_DURATION, TIME_START_HOUR, TIME_END_HOUR } from './constants'
// 缺少 TIME_AXIS_HOURS
```

**使用处**: 第77行 `const maxBottom = TIME_AXIS_HOURS * HOUR_HEIGHT`

### 修改

在 import 中添加 `TIME_AXIS_HOURS`：

```typescript
import { HOUR_HEIGHT, TIME_GRANULARITY, MIN_DURATION, TIME_START_HOUR, TIME_END_HOUR, TIME_AXIS_HOURS } from './constants'
```