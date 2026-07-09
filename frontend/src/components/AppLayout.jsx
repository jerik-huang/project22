import { useEffect } from 'react'
import { Layout, theme, Avatar, Button, Dropdown, Space } from 'antd'
import { App as AntdApp } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { setMessageApi } from '../api/request'
import { useAuth } from '../contexts/AuthContext'

const { Header, Content } = Layout

/**
 * 应用整体布局:轻量顶栏 + 宽内容区。
 *
 * 结构:
 *   ┌──────────────────────────────────────────────────┐
 *   │ [Logo] 用户管理系统   [用户列表]      [登录/用户]   │ ← 粘性顶栏
 *   ├──────────────────────────────────────────────────┤
 *   │                                                  │
 *   │              页面内容(Outlet)                     │ ← 各路由页面在此渲染
 *   │                                                  │
 *   └──────────────────────────────────────────────────┘
 *
 * 顶栏右侧根据登录状态显示:
 *   - 未登录:显示"登录"与"注册"按钮;
 *   - 已登录:显示用户头像 + 用户名下拉(含"退出登录")。
 *
 * 同时负责:把 antd 的 message 实例注入到 axios 拦截器,
 * 让拦截器弹出的提示能正确应用主题。
 */
export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const { token } = theme.useToken()
  const { user, isAuthenticated, logout } = useAuth()

  // 注入运行时 message 实例,供 axios 拦截器弹提示(见 api/request.js)
  useEffect(() => {
    setMessageApi(message)
  }, [message])

  // 当前是否处于列表页(用于高亮导航项)
  const isList = location.pathname === '/'

  /** 退出登录:清空登录态并跳转到登录页 */
  const handleLogout = () => {
    logout()
    message.success('已退出登录')
    navigate('/login', { replace: true })
  }

  // 展示名:优先昵称,其次用户名
  const displayName = user ? user.nickname || user.username : ''

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* ============ 粘性顶栏 ============ */}
      <Header
        style={{
          position: 'sticky',     // 滚动时顶栏固定在顶部
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
          gap: 32,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        }}
      >
        {/* ---- Logo 区:点击回到首页 ---- */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: token.colorText,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {/* 渐变图标方块:用品牌色增强识别度 */}
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(22,119,255,0.35)',
            }}
          >
            <TeamOutlined style={{ fontSize: 18 }} />
          </span>
          <span>用户管理系统</span>
        </Link>

        {/* ---- 导航区 ---- */}
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', height: '100%' }}>
          <Link
            to="/"
            style={{
              height: 40,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              // 当前页高亮:命中主色 + 浅色背景
              color: isList ? token.colorPrimary : token.colorTextSecondary,
              background: isList ? token.colorPrimaryBg : 'transparent',
              transition: 'all .2s',
            }}
          >
            用户列表
          </Link>
        </nav>

        {/* ---- 右侧操作区:根据登录状态显示不同入口 ---- */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {isAuthenticated ? (
            // 已登录:用户头像 + 下拉菜单(退出登录)
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出登录',
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 8,
                  transition: 'background .2s',
                }}
              >
                <Avatar
                  size={30}
                  style={{ background: token.colorPrimary }}
                  icon={<UserOutlined />}
                />
                <span style={{ color: token.colorText, fontWeight: 500, fontSize: 14 }}>
                  {displayName}
                </span>
              </Space>
            </Dropdown>
          ) : (
            // 未登录:登录 + 注册 按钮
            <Space>
              <Link to="/login">
                <Button size="middle">登录</Button>
              </Link>
              <Link to="/register">
                <Button type="primary" size="middle">
                  注册
                </Button>
              </Link>
            </Space>
          )}
        </div>
      </Header>

      {/* ============ 内容区:子路由在此渲染 ============ */}
      <Content>
        <Outlet />
      </Content>
    </Layout>
  )
}
