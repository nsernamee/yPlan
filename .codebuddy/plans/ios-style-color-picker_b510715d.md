---
name: ios-style-color-picker
overview: 全面重构 ColorPicker 组件为 iOS 风格的自建颜色选择面板，包含饱和度/亮度方形区域 + 色相滑条 + 优化的预设颜色网格布局，解决移动端原生 input type=color 样式不一致的问题。
design:
  architecture:
    framework: vue
  styleKeywords:
    - iOS Native
    - Glassmorphism
    - Minimalism
    - Smooth Animation
    - Mobile First
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 13px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#618DFF"
      - "#0052D9"
    background:
      - "#FFFFFF"
      - "#F9FAFB"
      - rgba(255,255,255,0.85)
    text:
      - "#1F1F1F"
      - "#6B7280"
      - "#FFFFFF"
    functional:
      - "#E5E7EB"
      - "#374151"
      - "#00A870"
todos:
  - id: create-color-utils
    content: 创建 src/utils/color.ts，实现 HSL/RGB/HEX 颜色转换工具函数（hslToRgb、rgbToHex、hexToHsl）
    status: completed
  - id: rewrite-colorpicker
    content: 全面重写 ColorPicker.vue：iOS风格UI、2D饱和度亮度选择区、色相滑条、预设色网格、展开/收起逻辑、移动端适配
    status: completed
    dependencies:
      - create-color-utils
  - id: verify-integration
    content: 验证 TaskPanel 中 ColorPicker 的 v-model 接口兼容性和深色模式表现
    status: completed
    dependencies:
      - rewrite-colorpicker
---

## 产品概述

将任务编辑页面(ColorPicker)的颜色选择组件从依赖原生 `<input type="color">` 全面重构为自建的 iOS 风格颜色选择面板，解决手机和电脑上显示效果不一致的问题。

## 核心功能

- **饱和度/亮度二维选择区域**：通过 HSL 色彩空间实现，用户可在方形区域内选择饱和度和亮度，类似 iOS 原生颜色选择器
- **色相(Hue)滑条**：垂直或水平色相渐变条，拖动选择基础色相
- **预设颜色网格**：将6个预设色改为紧凑的网格/圆点布局，选中状态清晰
- **实时预览**：显示当前选中颜色的预览块
- **统一交互体验**：手机和电脑完全一致的视觉效果，触摸友好
- **保持接口不变**：v-model 绑定 TaskColor 类型，兼容预设色名和自定义 hex 字符串

## Tech Stack

- Vue 3 Composition API + TypeScript（与项目一致）
- 纯 CSS 实现（无需额外依赖库）
- HSL/RGB/HEX 颜色空间转换函数（自实现）

## 实现方案

### 整体架构：展开式面板设计

点击颜色区域后，从触发位置弹出(iOS风格底部弹窗)或在旁边展开(桌面端 popover)一个完整的颜色选择面板：

```
┌─────────────────────────────┐
│   当前颜色预览 (圆形)        │
│                             │
│  ┌───────────────────┐     │
│  │                   │     │  ← 饱和度×亮度 二维选择区
│  │    2D Picker      │     │    (CSS gradient: 白→hue色→黑)
│  │                   │     │
│  └───────────────────┘     │
│  ┌───────────────────┐     │
│  │  R G B Y G C B M  │     │  ← 色相滑条 (水平)
│  └───────────────────┘     │
│                             │
│  ● ● ● ● ● ●               │  ← 预设颜色圆点
│                             │
└─────────────────────────────┘
```

### 核心技术点

#### 1. HSL ↔ RGB ↔ HEX 转换

自实现三个工具函数（不引入第三方库）：

- `hslToRgb(h, s, l)` → `{ r, g, b }`
- `rgbToHex(r, g, b)` → `#RRGGBB`
- `hexToHsl(hex)` → `{ h, s, l }`

#### 2. 二维选择区域渲染

使用多层 CSS 渐变叠加：

```css
background: linear-gradient(to top, #000, transparent),  /* 亮度: 下黑→上透 */
            linear-gradient(to right, #fff, currentHue); /* 饱和度: 左白→右色 */
```

#### 3. 指示器位置

用绝对定位的圆形指示器（带白色边框+阴影）跟随手指/鼠标：

- X轴 → 饱和度 (0-100%)
- Y轴 → 亮度 (0-100%，注意Y轴反转)

#### 4. 统一指针事件

使用 `pointerdown/move/up` 替代 mouse/touch 分离处理，天然支持触摸+鼠标。

#### 5. 展开模式

- **桌面端 (>768px)**：在 ColorPicker 下方以 popover 形式展开，带圆角毛玻璃背景
- **移动端 (<=768px)**：以底部抽屉形式从屏幕底部滑出（覆盖层+面板），更符合移动端操作习惯

### 数据流

```
用户操作(点击/拖动2D区域) 
  → 更新内部 h/s/l 状态 
  → 计算 hex 
  → emit('update:modelValue', hex)
  → 同步到父组件 TaskPanel 的 editForm.color
```

预设色点击直接 emit 预设名称(如 'blue')；自定义颜色操作 emit hex 值(如 '#FF5733')。

## 涉及文件

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/components/common/ColorPicker.vue` | [MODIFY] | 全面重构为 iOS 风格自建颜色选择器 |
| `src/utils/color.ts` | [NEW] | HSL/RGB/HEX 颜色转换工具函数 |


## 实现注意事项

- **性能**：2D 区域拖动时使用 `requestAnimationFrame` 或节流，避免高频更新
- **边界安全**：所有 clamp 到 0-255 / 0-360 / 0-100 范围
- **深色模式**：面板背景用毛玻璃效果适配 dark: 前缀
- **无障碍**：保留 title/aria-label，支持键盘基本操作
- **动画**：面板展开使用 scaleIn + fade 动画(参考 STYLE_GUIDE)
- **点击外部关闭**：移动端遮罩层点击关闭，桌面端点击外部区域关闭

## 设计方案：iOS 风格颜色选择器

### 交互流程

1. **收起状态**：显示当前颜色的圆形色块 + 预设色快捷圆点横排
2. **展开状态**：点击后展开完整颜色面板，包含：

- 顶部：当前颜色大预览圆
- 中部：正方形的饱和度/亮度二维选择区（带白色边框指示器）
- 下部：水平色相彩虹滑条（带圆形指示器）
- 底部：6个预设颜色快速选取按钮（小圆点排列）

### 移动端特殊处理

- 底部弹窗式展开（fixed 定位，从底部 slideUp 进入）
- 半透明黑色遮罩层，点击关闭
- 弹窗高度自适应内容（约 320-380px）
- 圆角顶部（rounded-t-3xl），符合 iOS 底部抽屉规范

### 桌面端特殊处理

- 相对定位的 popover 展开（absolute 定位）
- 无需遮罩层，点击外部区域关闭
- 带阴影和圆角的卡片式外观