import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import UserList from './pages/UserList'
import UserForm from './pages/UserForm'
import UserDetail from './pages/UserDetail'

/**
 * 路由配置(React Router v6)。
 *
 * 路由结构:
 *   /                        → 用户列表(UserList)
 *   /users/new               → 新增用户(UserForm,新增模式)
 *   /users/:id               → 用户详情(UserDetail)
 *   /users/:id/edit          → 编辑用户(UserForm,编辑模式)
 *   *(其他任意路径)           → 重定向到首页
 *
 * 所有页面都套在 AppLayout 布局中(顶栏 + 内容区),
 * 通过 <Outlet /> 在布局内渲染当前路由对应的页面。
 */
export default function App() {
  return (
    <Routes>
      {/* 父路由:提供布局框架 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<UserList />} />
        <Route path="/users/new" element={<UserForm />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/users/:id/edit" element={<UserForm />} />
        {/* 兜底:未知路径统一回到列表页,避免白屏 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
