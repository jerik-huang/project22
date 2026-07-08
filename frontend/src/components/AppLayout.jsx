import { useEffect } from 'react'
import { Layout, theme } from 'antd'
import { App as AntdApp } from 'antd'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { TeamOutlined } from '@ant-design/icons'
import { setMessageApi } from '../api/request'

const { Header, Content } = Layout

/**
 * 应用整体布局:轻量顶栏 + 宽内容区。
 *
 * 结构:
 *   ┌─────────────────────────────────────┐
 *   │ [Logo] 用户管理系统   [用户列表]      │ ← 粘性顶栏
 *   ├─────────────────────────────────────┤
 *   │                                     │
 *   │           页面内容(Outlet)           │ ← 各路由页面在此渲染
 *   │                                     │
 *   └─────────────────────────────────────┘
 *
 * 同时负责:把 antd 的 message 实例注入到 axios 拦截器,
 * 让拦截器弹出的提示能正确应用主题。
 */
export default function AppLayout() {
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const { token } = theme.useToken()

  // 注入运行时 message 实例,供 axios 拦截器弹提示(见 api/request.js)
  useEffect(() => {
    setMessageApi(message)
  }, [message])

  // 当前是否处于列表页(用于高亮导航项)
  const isList = location.pathname === '/'

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

        {/* 右侧弹性占位(预留位置:未来可放用户头像/设置入口) */}
        <div style={{ flex: 1 }} />
      </Header>

      {/* ============ 内容区:子路由在此渲染 ============ */}
      <Content>
        <Outlet />
      </Content>
    </Layout>
  )
}
