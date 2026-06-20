# Design System

> 奇笔AI 2.0 设计系统 — Deep Space 深空科技主题，暗色基底 + 青紫渐变光效

## Aesthetic

**定位**：现代 AI SaaS 产品的科技感视觉语言，深色基调传递专业与高级感，青紫渐变光效营造未来科技氛围。

**关键词**：深邃 · 流光 · 精密

## Colors

### Surfaces（表面层级）
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#05050D` | 页面最深底色 |
| `--bg-base` | `#0A0A16` | 基础背景 |
| `--bg-surface` | `rgba(255,255,255,0.025)` | 卡片/区块表面 |
| `--bg-elevated` | `rgba(255,255,255,0.05)` | 悬浮/高亮表面 |
| `--bg-glass` | `rgba(10,10,22,0.75)` | 玻璃态背景 |
| `--bg-glass-strong` | `rgba(12,12,26,0.85)` | 强玻璃态背景 |

### Accents（强调色）
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-cyan` | `#00D4FF` | 主强调色、链接、聚焦态 |
| `--accent-purple` | `#8B5CF6` | 辅强调色、渐变过渡 |
| `--accent-pink` | `#EC4899` | 点缀色、渐变收尾 |
| `--accent-teal` | `#00E5A0` | 成功/就绪状态 |
| `--accent-amber` | `#F59E0B` | 警告/加载状态 |
| `--accent-blue` | `#3B82F6` | 信息/辅助蓝色 |
| `--accent-orange` | `#F97316` | 暖色点缀 |
| `--accent-lime` | `#84CC16` | 绿色点缀 |

### Gradients（渐变）
| Token | Value |
|-------|-------|
| `--gradient-primary` | `linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #EC4899 100%)` |
| `--gradient-cyan-purple` | `linear-gradient(135deg, #00D4FF, #8B5CF6)` |
| `--gradient-purple-pink` | `linear-gradient(135deg, #8B5CF6, #EC4899)` |

### Text（文本色）
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#E4E4F0` | 正文、标题 |
| `--text-secondary` | `#9090A8` | 辅助文字、描述 |
| `--text-tertiary` | `#585870` | 禁用/占位文字 |

### Borders（边框）
| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255,255,255,0.05)` | 极淡分割线 |
| `--border-default` | `rgba(255,255,255,0.08)` | 默认边框 |
| `--border-strong` | `rgba(255,255,255,0.14)` | 强调边框 |
| `--border-glow` | `rgba(0,212,255,0.18)` | 发光边框 |

### Shadows（阴影）
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.3)` | 轻微浮起 |
| `--shadow-md` | `0 4px 24px rgba(0,0,0,0.4)` | 卡片标准阴影 |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.6)` | 弹窗阴影 |
| `--shadow-glow-cyan` | `0 0 30px rgba(0,212,255,0.12)` | 青色光晕 |
| `--shadow-glow-purple` | `0 0 30px rgba(139,92,246,0.1)` | 紫色光晕 |

## Typography

### Font Family
- 系统字体栈：`-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Inter', sans-serif`
- 优先级：系统原生 → 中文字体 → Inter → 通用无衬线

### Type Scale
| Level | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Hero h1 | `clamp(38px, 6.5vw, 58px)` | 800 | 1.12 | -1.5px |
| Section Title | `19px` | 700 | — | -0.3px |
| Card Title | `15px` | 700 | — | -0.2px |
| Body | `14px` | 400 | 1.9 | — |
| Caption | `12px` | 400/600 | — | — |
| Overline | `10px` | 600 | — | 0.6px |

## Layout & Spacing

### Spacing Scale（8px 基数）
| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 64px |

### Grid
- 工具卡片：`repeat(auto-fill, minmax(276px, 1fr))`，gap 16px
- 最大内容宽度：1200px（首页）/ 900px（工具详情）

### Radii（圆角）
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 10px | 小按钮、标签 |
| `--radius-md` | 16px | 卡片、输入框 |
| `--radius-lg` | 24px | 大区块、弹窗 |
| `--radius-xl` | 32px | 特大容器 |

### Responsive Breakpoints
| Breakpoint | Behavior |
|------------|----------|
| ≤ 768px | 导航简化、卡片缩至2列 |
| ≤ 480px | 单列布局、logo badge 隐藏 |

## Components

### Tool Card
- 背景：`rgba(255,255,255,0.025)` + 16px blur
- 边框：1px `--border-subtle`
- 圆角：24px
- Hover：上移 4px + 青色发光边框 + 顶部流光扫过
- Active：`rgba(0,212,255,0.04)` 背景 + 加粗发光边框

### Button — Primary (Generate)
- 背景：`--gradient-primary`，200% background-size
- 动画：`btnShimmer` 4s 循环渐变位移
- 阴影：`0 4px 28px rgba(0,212,255,0.25)`
- Hover：上移 2px + 增强光晕 + 内发光遮罩
- Disabled：opacity 0.55，动画停止

### Tag Button
- 默认：深色背景 + 淡边框
- Hover：青色边框 + 微上移
- Selected：青紫渐变填充 + 光晕阴影

### Textarea
- 背景：`rgba(0,0,0,0.2)` 半透明深色
- 边框：`rgba(255,255,255,0.08)`
- Focus：青色发光边框 + 外光晕

### Glass Panel（玻璃面板）
- 所有 form-section、output-area、header 使用
- `backdrop-filter: blur(20px)` + 半透明深色背景
- 悬浮时边框亮度微增

## Motion

### Duration
| Type | Duration | Easing |
|------|----------|--------|
| 快速交互 | 220ms | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| 标准过渡 | 280-300ms | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| 卡片悬浮 | 350ms | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| 强调动画 | 400-500ms | `ease-in-out` / `ease-out` |

### Background Animations
| Animation | Duration | Description |
|-----------|----------|-------------|
| `auroraShift` | 22s | 极光渐变缓慢漂移 + 缩放 |
| `particlesFloat` | 30s | 粒子缓慢上浮 + 微旋转 |
| `logoGlow` | 3s | Logo 光晕呼吸 |
| `btnShimmer` | 4s | 按钮渐变流动 |
| `heroGlowBreathe` | 5s | Hero 光晕缩放呼吸 |

### Card Entrance
- 卡片入场使用 `cardIn` 动画（opacity 0→1, translateY 20px→0）
- 每张卡片动画延迟递增 0.05s，形成瀑布流效果

## Background System

页面背景由 4 层叠加构成：
1. **深色基底**（`body::before`）：纯色 `#05050D`
2. **极光渐变**（`.bg-aurora`）：4 个径向渐变椭圆，青/紫/粉/绿缓慢位移
3. **科技网格**（`.bg-grid`）：64px 间距的细线网格，边缘羽化
4. **浮动粒子**（`.bg-particles`）：10 个随机分布的彩色光点，缓慢上浮
