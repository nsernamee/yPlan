# yPlan 项目风格标准文档

> 本文档定义了 yPlan 项目的视觉设计规范，包括颜色、动效、组件样式、布局等标准。

---

## 目录

1. [颜色系统](#1-颜色系统)
2. [动效系统](#2-动效系统)
3. [组件样式](#3-组件样式)
4. [布局规范](#4-布局规范)
5. [字体规范](#5-字体规范)
6. [图标规范](#6-图标规范)
7. [交互反馈](#7-交互反馈)
8. [深色模式](#8-深色模式)

---

## 1. 颜色系统

### 1.1 品牌主色

| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#0052D9` | 主按钮、选中状态、链接、强调元素 |
| Primary Light | `#366EF4` | 悬停状态、次要强调 |
| Primary Lighter | `#618DFF` | 浅色背景、标签 |

**使用规范：**
- 主要 CTA（行动召唤）按钮必须使用 Primary
- 选中/激活状态使用 Primary 或 Primary/10% 透明度背景
- 品牌元素（Logo、图标）可使用 Primary

### 1.2 任务颜色

| 颜色 | 色值 | 标签 | 用途 |
|------|------|------|------|
| Blue | `#618DFF` | 工作 | 工作相关任务 |
| Green | `#2BA47D` | 学习 | 学习、成长类任务 |
| Orange | `#ED7B2F` | 重要 | 重要事项 |
| Red | `#E34D59` | 紧急 | 紧急任务 |
| Purple | `#9F6FFF` | 个人 | 个人事务 |
| Gray | `#B7280` | 临时 | 临时任务 |

**任务卡片样式：**
- 背景：`{color}/20`（20% 透明度）
- 左边框：`{color}`（4px 实线）
- 文字：`{color}`

### 1.3 功能色

| 名称 | 色值 | 用途 |
|------|------|------|
| Success | `#00A870` | 成功状态、完成标记、正向反馈 |
| Error | `#E34D59` | 错误状态、删除操作、警告 |
| Warning | `#ED7B2F` | 警告提示、注意事项 |

### 1.4 背景色

| 名称 | 色值（浅色模式） | 色值（深色模式） | 用途 |
|------|------------------|------------------|------|
| Background | `#FFFFFF` | `#1F1F1F` | 页面主背景 |
| Background Gray | `#F3F4F6` | `#1F1F1F` | 次级背景、卡片背景 |
| Card | `#FFFFFF` | `#1F1F1F` | 卡片、面板背景 |

### 1.5 文字色

| 名称 | 色值（浅色模式） | 色值（深色模式） | 用途 |
|------|------------------|------------------|------|
| Text Default | `#1F1F1F` | `#F5F5F5` | 主要文字、标题 |
| Text Secondary | `#4B5563` | `#9CA3AF` | 次要文字、说明 |
| Text Muted | `#9CA3AF` | `#6B7280` | 辅助文字、占位符 |

### 1.6 边框色

| 名称 | 色值（浅色模式） | 色值（深色模式） | 用途 |
|------|------------------|------------------|------|
| Border | `#E5E7EB` | `#374151` | 通用边框、分割线 |
| Border Light | `#F3F4F6` | `#1F1F1F` | 浅色边框、内部分割 |

---

## 2. 动效系统

### 2.1 时间曲线（Easing）

| 名称 | 曲线值 | 用途 |
|------|--------|------|
| Apple | `cubic-bezier(0.4, 0, 0.2, 1)` | 通用过渡、状态变化 |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹性效果、强调动画 |
| Ease Out | `ease-out` | 快速启动、缓慢停止 |
| Ease In | `ease-in` | 缓慢启动、快速停止（用于退出） |

**使用建议：**
- 进入动画优先使用 Spring 曲线，增加活力感
- 退出动画使用 Ease In，快速消失不拖沓
- 状态过渡使用 Apple 曲线，平滑自然

### 2.2 动画时长

| 类型 | 时长 | 用途 |
|------|------|------|
| 微交互 | `100-150ms` | 按钮悬停、图标变化 |
| 标准过渡 | `200ms` | 状态变化、面板展开 |
| 弹性动画 | `300-400ms` | 弹跳效果、拖拽结束 |
| 页面切换 | `200-300ms` | 路由切换、模态框 |

### 2.3 预设动画

#### 2.3.1 淡入淡出（Fade）

```css
/* 淡入 */
animation: fadeIn 0.2s ease-out;

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**用途：** 遮罩层、提示气泡、下拉菜单

#### 2.3.2 滑入（Slide In）

```css
/* 从上方滑入 */
animation: slideIn 0.2s ease-out;

@keyframes slideIn {
  0% { transform: translateY(-10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

**用途：** 下拉菜单、通知提示、Toast

#### 2.3.3 缩放弹入（Scale In）

```css
/* 缩放弹入 */
animation: scaleIn 0.15s ease-out;

@keyframes scaleIn {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

**用途：** 气泡提示、小面板、弹出卡片

#### 2.3.4 弹性回弹（Spring Bounce）

```css
/* 弹性回弹 */
animation: springBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

@keyframes springBounce {
  0% { transform: scale(1.02); }
  30% { transform: scale(0.98); }
  50% { transform: scale(1.01); }
  70% { transform: scale(0.995); }
  100% { transform: scale(1); }
}
```

**用途：** 任务拖拽结束、按钮点击反馈、完成动画

#### 2.3.5 面板进入（Panel Enter）

```css
/* 面板从右侧滑入 */
animation: panelEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

@keyframes panelEnter {
  0% { opacity: 0; transform: translateX(20px) scale(0.95); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
```

**用途：** 侧边面板、编辑面板、详情面板

#### 2.3.6 面板退出（Panel Leave）

```css
/* 面板向右滑出 */
animation: panelLeave 0.2s ease-in;

@keyframes panelLeave {
  0% { opacity: 1; transform: translateX(0) scale(1); }
  100% { opacity: 0; transform: translateX(20px) scale(0.95); }
}
```

**用途：** 面板关闭动画

#### 2.3.7 微光扫过（Shimmer）

```css
/* 微光扫过效果 */
animation: shimmer 2s infinite;

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

**用途：** 加载状态、骨架屏、强调元素

### 2.4 交互状态动画

| 状态 | 动画 | 描述 |
|------|------|------|
| Hover | `scale(1.02)` + 阴影增强 | 轻微放大，增加立体感 |
| Active | `scale(0.96)` + 阴影减弱 | 按下缩小，触感反馈 |
| Focus | `ring-2 ring-primary/20` | 聚焦环，辅助键盘导航 |
| Disabled | `opacity: 0.5` | 禁用状态，降低视觉权重 |

---

## 3. 组件样式

### 3.1 磨砂玻璃效果（Glass Morphism）

项目使用多层磨砂玻璃效果，营造层次感和深度。

#### 3.1.1 标准磨砂（Glass）

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**用途：** 主面板、大卡片、模态框背景

#### 3.1.2 轻量磨砂（Glass Light）

```css
.glass-light {
  background: rgba(255, 255, 255, 0.60);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

**用途：** 任务滑块、导航栏、浮动元素

#### 3.1.3 极轻磨砂（Glass Subtle）

```css
.glass-subtle {
  background: rgba(255, 255, 255, 0.40);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**用途：** 悬停状态、微妙层次

**深色模式适配：**
- `.glass-dark`: `rgba(0, 0, 0, 0.40)`
- `.glass-light-dark`: `rgba(0, 0, 0, 0.30)`
- `.glass-subtle-dark`: `rgba(0, 0, 0, 0.20)`

### 3.2 按钮样式

#### 3.2.1 主按钮（Primary Button）

```css
.btn-apple-primary {
  /* 基础样式 */
  background: #0052D9;
  color: white;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 500;
  
  /* 过渡动画 */
  transition: all 0.2s ease-out;
  
  /* 悬停状态 */
  &:hover {
    background: #366EF4;
    box-shadow: 0 4px 12px rgba(0, 82, 217, 0.25);
    transform: scale(1.02);
  }
  
  /* 按下状态 */
  &:active {
    transform: scale(0.96);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* 禁用状态 */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}
```

**使用场景：** 主要操作、提交、确认

#### 3.2.2 次按钮（Secondary Button）

```css
.btn-apple-secondary {
  background: white;
  color: #374151;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 8px 16px;
  
  &:hover {
    background: #F9FAFB;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

/* 深色模式 */
.dark .btn-apple-secondary {
  background: #1F2937;
  border-color: #374151;
  color: #E5E7EB;
}
```

**使用场景：** 取消、次要操作

#### 3.2.3 圆角规范

| 尺寸 | 圆角值 | 用途 |
|------|--------|------|
| 小 | `8px` (`rounded-lg`) | 标签、徽章、小组件 |
| 中 | `12px` (`rounded-xl`) | 按钮、输入框、卡片 |
| 大 | `16px` (`rounded-2xl`) | 面板、模态框 |
| 全圆 | `9999px` (`rounded-full`) | 头像、圆形按钮 |

### 3.3 输入框样式

```css
.input-apple {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 8px 12px;
  transition: all 0.2s ease-out;
  
  &:focus {
    border-color: #0052D9;
    box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.2);
    outline: none;
  }
}

/* 深色模式 */
.dark .input-apple {
  background: #1F2937;
  border-color: #374151;
  color: #E5E7EB;
}
```

### 3.4 任务滑块样式

```css
.task-slider {
  /* 磨砂背景 */
  background: rgba(255, 255, 255, 0.60);
  backdrop-filter: blur(12px);
  
  /* 左边框标识颜色 */
  border-left: 4px solid {taskColor};
  border-radius: 12px;
  
  /* 过渡 */
  transition: all 0.2s ease-out;
  
  /* 悬停 */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  /* 拖拽中 */
  &.dragging {
    box-shadow: 0 12px 32px rgba(0, 82, 217, 0.35);
    transform: scale(1.02);
    transition: none;
  }
}
```

### 3.5 滚动条样式

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

/* 深色模式 */
.dark .scrollbar-thin {
  scrollbar-color: #4b5563 transparent;
}
```

### 3.6 卡片样式

```css
.card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  /* 悬停效果 */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #D1D5DB;
  }
}

/* 深色模式 */
.dark .card {
  background: #1F2937;
  border-color: #374151;
}
```

---

## 4. 布局规范

### 4.1 时间轴配置

| 参数 | 值 | 描述 |
|------|-----|------|
| 每小时高度 | `60px` | `HOUR_HEIGHT` |
| 头部高度 | `40px` | `HEADER_HEIGHT` |
| 时间粒度 | `15分钟` | `TIME_GRANULARITY` |
| 移动阈值 | `5px` | `MOVE_THRESHOLD` |
| 最小任务时长 | `5分钟` | `MIN_DURATION` |

### 4.2 间距规范

| 名称 | 值 | 用途 |
|------|-----|------|
| xs | `4px` | 图标与文字间距 |
| sm | `8px` | 紧凑元素间距 |
| md | `12px` | 标准间距 |
| lg | `16px` | 卡片内边距 |
| xl | `24px` | 区块间距 |
| 2xl | `32px` | 大区块间距 |

### 4.3 响应式断点

| 断点 | 宽度 | 设备 |
|------|------|------|
| Mobile | `< 768px` | 手机 |
| Tablet | `768px - 1024px` | 平板 |
| Desktop | `> 1024px` | 桌面 |

### 4.4 时间刻度宽度

- 左侧时间刻度：`64px`（4rem）
- 任务区域：剩余宽度

---

## 5. 字体规范

### 5.1 字体栈

```css
font-family: 'PingFang SC', system-ui, sans-serif;
```

**说明：**
- 优先使用 PingFang SC（macOS/iOS 系统字体）
- 回退到 system-ui（各平台系统字体）
- 最后回退到 sans-serif

### 5.2 字号规范

| 名称 | 大小 | 行高 | 用途 |
|------|------|------|------|
| xs | `12px` | `16px` | 辅助文字、时间标签 |
| sm | `14px` | `20px` | 次要文字、说明 |
| base | `16px` | `24px` | 正文内容 |
| lg | `18px` | `28px` | 小标题 |
| xl | `20px` | `28px` | 大标题 |
| 2xl | `24px` | `32px` | 页面标题 |

### 5.3 字重规范

| 字重 | 值 | 用途 |
|------|-----|------|
| Regular | `400` | 正文内容 |
| Medium | `500` | 按钮文字、强调文字 |
| Semibold | `600` | 标题、重要信息 |

---

## 6. 图标规范

### 6.1 图标库

项目使用 **Lucide Icons** 图标库。

### 6.2 图标尺寸

| 名称 | 大小 | 用途 |
|------|------|------|
| xs | `12px` | 行内图标 |
| sm | `16px` | 按钮图标、列表图标 |
| md | `20px` | 导航图标、工具栏图标 |
| lg | `24px` | 空状态图标 |
| xl | `32px` | 大图标、强调图标 |

### 6.3 图标颜色

- 默认：`currentColor`（继承文字颜色）
- 次要：`#9CA3AF`
- 交互：`#0052D9`

---

## 7. 交互反馈

### 7.1 拖拽反馈

#### 7.1.1 拖拽开始

- 原任务降低透明度（`opacity: 0.3`）
- 拖拽预览显示，应用磨砂效果
- 阴影增强，增加浮起感

#### 7.1.2 拖拽中

- 目标区域高亮（蓝色虚线边框 + 脉冲背景）
- 预览指示器跟随鼠标
- 显示目标时间气泡

#### 7.1.3 拖拽结束

- 弹性回弹动画（`springBounce`）
- 任务平滑过渡到新位置
- 清除所有高亮状态

### 7.2 目标区域高亮

```css
.drop-target-highlight {
  background: rgba(0, 82, 217, 0.08);
  animation: dropTargetPulse 1s infinite;
}

.drop-target-highlight::before {
  border: 2px dashed #0052D9;
  border-radius: 8px;
}

@keyframes dropTargetPulse {
  0%, 100% { background-color: rgba(0, 82, 217, 0.05); }
  50% { background-color: rgba(0, 82, 217, 0.12); }
}
```

### 7.3 加载状态

- 使用骨架屏（Skeleton）代替 Loading Spinner
- 骨架屏应用微光扫过效果（Shimmer）
- 颜色：浅色模式 `#F3F4F6`，深色模式 `#374151`

### 7.4 空状态

- 居中显示图标（64px，灰色）
- 主提示文字（16px，中等字重）
- 次要说明（14px，浅灰色）
- 可选操作按钮

---

## 8. 深色模式

### 8.1 切换策略

- 首次访问：跟随系统偏好
- 手动切换：保存到 localStorage
- 切换动画：背景色 300ms 平滑过渡

### 8.2 颜色映射

| 元素 | 浅色模式 | 深色模式 |
|------|----------|----------|
| 主背景 | `#FFFFFF` | `#0F0F0F` |
| 卡片背景 | `#FFFFFF` | `#1F1F1F` |
| 边框 | `#E5E7EB` | `#374151` |
| 文字主色 | `#1F1F1F` | `#F5F5F5` |
| 文字次色 | `#4B5563` | `#9CA3AF` |
| 磨砂背景 | `rgba(255,255,255,0.72)` | `rgba(0,0,0,0.40)` |

### 8.3 实现方式

```vue
<template>
  <div class="bg-white dark:bg-gray-950">
    <!-- 组件内容 -->
  </div>
</template>
```

**说明：**
- 使用 Tailwind CSS 的 `dark:` 前缀
- 在根元素添加/移除 `.dark` 类
- 优先使用语义化颜色类（如 `bg-background`）

---

## 9. 代码示例

### 9.1 标准卡片组件

```vue
<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
    <!-- 内容 -->
  </div>
</template>
```

### 9.2 主按钮

```vue
<template>
  <button class="bg-primary hover:bg-primary-light text-white rounded-xl px-4 py-2 font-medium transition-all duration-200 active:scale-[0.96] hover:shadow-lg hover:shadow-primary/25">
    按钮文字
  </button>
</template>
```

### 9.3 输入框

```vue
<template>
  <input 
    class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
    placeholder="请输入..."
  />
</template>
```

### 9.4 任务标签

```vue
<template>
  <span class="px-2 py-1 text-xs font-medium rounded-lg bg-task-blue/20 text-task-blue">
    工作
  </span>
</template>
```

---

## 10. 最佳实践

### 10.1 性能优化

1. **避免过度使用磨砂效果**：磨砂效果消耗 GPU 资源，仅在关键层级使用
2. **合理使用动画**：仅在用户交互和重要状态变化时使用动画
3. **防抖和节流**：拖拽、滚动等高频事件需要节流处理

### 10.2 可访问性

1. **颜色对比度**：确保文字与背景的对比度符合 WCAG AA 标准
2. **键盘导航**：所有交互元素支持键盘焦点和操作
3. **焦点指示器**：使用清晰的焦点环样式

### 10.3 一致性

1. **复用组件**：相同功能的组件抽取为可复用组件
2. **统一命名**：遵循 Tailwind CSS 和项目命名规范
3. **遵循文档**：新增样式优先参考本文档定义

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-04-03 | 1.0.0 | 初始版本 |

---

> 本文档由 yPlan 项目团队维护，如有疑问请联系开发者。
