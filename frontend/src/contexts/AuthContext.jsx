import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  USER_KEY,
  clearAuth,
  getCurrentUser,
  getToken,
  login as loginApi,
  saveToken,
} from '../api/auth'

/**
 * 全局鉴权上下文。
 *
 * 职责:
 *  1. 维护当前登录用户(user)与加载状态(loading);
 *  2. 暴露 login / logout 方法供页面调用;
 *  3. 应用启动时根据 localStorage 中的 token 自动恢复会话(调用 /auth/me 校验)。
 *
 * 使用方式:
 *   - 在 main.jsx 中用 <AuthProvider> 包裹 <App />;
 *   - 在任意子组件中 const { user, isAuthenticated, login, logout } = useAuth()。
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // 初始为 true:应用启动时正在尝试从本地 token 恢复会话,
  // 期间路由守卫会展示 loading,避免恢复完成前闪现登录页或受保护页。
  const [loading, setLoading] = useState(true)

  // ---------------------------------------------------------------
  // 启动时:若本地存在 token,则请求 /auth/me 校验并恢复用户信息。
  // ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    // 乐观展示:先从缓存读取用户信息,避免界面短暂"未登录"状态
    const cached = localStorage.getItem(USER_KEY)
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch {
        /* 缓存损坏则忽略 */
      }
    }
    // 用 token 向后端校验,以缓存值为准但会被真实结果覆盖
    getCurrentUser()
      .then((u) => {
        if (cancelled) return
        setUser(u)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      })
      .catch(() => {
        if (cancelled) return
        // token 无效/过期:清空本地登录态
        clearAuth()
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ---------------------------------------------------------------
  // 登录:调用后端 /auth/login,保存 token 与用户信息。
  // ---------------------------------------------------------------
  const login = useCallback(async (username, password) => {
    // 后端返回 { access_token, token_type, user }
    const data = await loginApi({ username, password })
    saveToken(data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  // ---------------------------------------------------------------
  // 登出:清空本地登录态(token + 用户信息),并重置内存状态。
  // (JWT 是无状态的,前端登出无需通知后端。)
  // ---------------------------------------------------------------
  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** 在子组件中获取鉴权状态的 hook */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 <AuthProvider> 内部使用')
  }
  return ctx
}

export default AuthContext
