/**
 * 颜色转换工具函数
 * 支持 HSL ↔ RGB ↔ HEX 互转，用于自建颜色选择器
 */

export interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export interface RGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

/**
 * HSL → RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/**
 * RGB → HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
    case g: h = ((b - r) / d + 2) * 60; break
    case b: h = ((r - g) / d + 4) * 60; break
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * RGB → HEX (如 #RRGGBB)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

/**
 * HEX → RGB
 */
export function hexToRgb(hex: string): RGB {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  }
}

/**
 * HEX → HSL
 */
export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

/**
 * HSL → HEX
 */
export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

/**
 * 根据色相和面板坐标生成颜色
 * @param h 色相 0-360
 * @param x 面板x位置 0-1（控制饱和度）
 * @param y 面板y位置 0-1（控制亮度）
 */
export function getColorFromPoint(h: number, x: number, y: number): string {
  const s = x * 100
  const l = y * 100
  return hslToHex(h, s, l)
}
