import { genderMeta } from '../styles/theme'
import { ManOutlined, WomanOutlined, UserOutlined } from '@ant-design/icons'

// 性别对应的图标(满足 color-not-only:除颜色外还有图标区分)
const ICONS = {
  male: <ManOutlined />,
  female: <WomanOutlined />,
  other: <UserOutlined />,
}

/**
 * 性别标签:同时用「颜色 + 图标 + 文字」三种方式表达性别。
 *
 * 满足 ui-ux-pro-max 的 color-not-only 规则:
 * 不能单靠颜色传达信息(色弱用户无法分辨),故同时辅以图标和文字。
 * 胶囊式圆角设计,视觉更柔和现代。
 *
 * @param {Object} props
 * @param {string} props.value 性别值 male/female/other
 */
export default function GenderTag({ value }) {
  const meta = genderMeta[value] || genderMeta.other
  return (
    <span
      className="gender-tag"
      style={{ color: meta.color, background: meta.bg }}
    >
      {ICONS[value] || ICONS.other}
      {meta.text}
    </span>
  )
}
