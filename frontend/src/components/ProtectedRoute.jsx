import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'

/**
 * 路由守卫:包裹需要登录才能访问的页面。
 *
 * 工作流程:
 *   1. 会话恢复中(loading)→ 展示全屏 loading,避免页面闪烁;
 *   2. 未登录 → 重定向到 /login,并记录"用户想去的页面"到 location.state,
 *      登录成功后由 Login 页跳回(from);
 *   3. 已登录 → 渲染子路由 <Outlet />。
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" tip="加载中…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // 记录来源路径,登录后可跳回(见 Login.jsx 的 location.state.from)
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
