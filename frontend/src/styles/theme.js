/**
 * 设计令牌(Design Tokens)
 *
 * 集中定义颜色、圆角、阴影等,供 AntD ConfigProvider 与自定义样式共用。
 * 品牌蓝 #1677ff,遵循 ui-ux-pro-max 的 color-semantic 与 elevation-consistent 规则:
 *  - 颜色语义化(每个颜色都有明确用途);
 *  - 阴影层级统一(同一视觉层使用同一档阴影)。
 *
 * 修改主题时只需改这里,全应用自动生效,避免到处硬编码 hex 值。
 */

// 品牌色板(语义化命名,便于按用途取用)
export const palette = {
  primary: '#1677ff',       // 主品牌色:用于主按钮、链接、选中态
  primaryHover: '#4096ff',  // 主色悬停态
  primaryActive: '#0958d9', // 主色按下态
  success: '#52c41a',       // 成功(新增、保存)
  warning: '#faad14',       // 警告
  danger: '#ff4d4f',        // 危险(删除)
  dangerBg: '#fff2f0',      // 危险操作背景色
  info: '#1677ff',          // 信息
}

/**
 * 性别 → 展示映射(颜色 + 背景 + 头像背景)。
 * 满足 color-not-only 规则:性别展示不只靠颜色,还会配合图标/文字(GenderTag 组件)。
 */
export const genderMeta = {
  male: { text: '男', color: '#1677ff', bg: '#e6f4ff', avatarBg: '#1677ff' },
  female: { text: '女', color: '#eb2f96', bg: '#fff0f6', avatarBg: '#eb2f96' },
  other: { text: '其他', color: '#8c8c8c', bg: '#f5f5f5', avatarBg: '#8c8c8c' },
}

// 头像候选背景色:根据用户名哈希取色,让字母头像丰富但稳定(同一用户始终同色)
export const avatarColors = [
  '#1677ff', '#52c41a', '#722ed1', '#13c2c2',
  '#eb2f96', '#fa8c16', '#2f54eb', '#08979c',
]

/**
 * 根据用户名生成稳定的头像背景色。
 * 用名字做哈希,保证同一用户每次渲染都是同一颜色(避免闪烁)。
 * @param {string} name 用户名
 * @returns {string} 颜色 hex
 */
export function pickAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

/**
 * 取用户名首字母(支持中文取首个字符)做大写头像。
 * 例如 "zhangsan" → "Z","张三" → "张"。
 * @param {string} name 用户名或昵称
 * @returns {string} 头像文字
 */
export function avatarText(name = '') {
  const trimmed = (name || '').trim()
  if (!trimmed) return '?'
  return trimmed[0].toUpperCase()
}

/**
 * AntD ConfigProvider 主题令牌。
 * 在 main.jsx 中通过 <ConfigProvider theme={antdTheme}> 注入,
 * 所有 AntD 组件会自动应用这里的配色、圆角、阴影。
 */
export const antdTheme = {
  // ---- 全局令牌 ----
  token: {
    colorPrimary: palette.primary,
    colorSuccess: palette.success,
    colorWarning: palette.warning,
    colorError: palette.danger,
    colorInfo: palette.info,

    borderRadius: 8,    // 统一圆角,营造柔和现代感
    borderRadiusLG: 12, // 大卡片等使用更大圆角
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif",

    // 阴影层级(elevation-consistent:同一档阴影统一使用)
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
    boxShadowSecondary:
      '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
  },
  // ---- 组件级令牌(覆盖个别组件的样式) ----
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 32px',
      bodyBg: '#f5f7fa', // 页面背景偏浅灰,与白色卡片形成层次
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary: '0 1px 2px 0 rgba(0,0,0,0.03)',
    },
    Table: {
      headerBg: '#fafbfc',       // 表头浅灰,与数据行区分
      headerColor: '#475467',
      headerSplitColor: 'transparent',
      rowHoverBg: '#f0f7ff',     // 行悬停浅蓝,呼应主色
      cellPaddingBlock: 14,
    },
    Button: {
      controlHeight: 36,
      fontWeight: 500,
    },
    Menu: {
      itemHeight: 56,
      iconSize: 16,
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: palette.primary,
    },
  },
}
