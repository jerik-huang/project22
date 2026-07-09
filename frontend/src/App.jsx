import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import UserList from './pages/UserList'
import UserForm from './pages/UserForm'
import UserDetail from './pages/UserDetail'
import Register from './pages/Register'
import Login from './pages/Login'

/**
 * 路由配置(React Router v6)。
 *
 * 路由分为两类:
 *   1. 公开页面(无需登录):登录 / 注册 —— 套在 AppLayout 内,保持顶栏一致;
 *   2. 受保护页面(需登录):用户列表 / 新增 / 详情 / 编辑 —— 由 ProtectedRoute 守卫,
 *      未登录会被重定向到 /login,并记录来源以便登录后跳回。
 *
 * 完整流程闭环:注册 → 登录 → 访问受保护页 → 登出。
 */
export default function App() {
  return (
    <Routes>
      {/* ============ 公开页面:登录 / 注册 ============ */}
      <Route element={<AppLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ============ 受保护页面:需登录才能访问 ============ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<UserList />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/users/:id/edit" element={<UserForm />} />
        </Route>
      </Route>

      {/* 兜底:未知路径统一回到首页,避免白屏 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
