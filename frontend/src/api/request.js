import axios from 'axios'
import { message as staticMessage } from 'antd'
import { clearAuth, getToken } from './auth'

/**
 * 全局 axios 实例。
 *
 * 设计要点:
 * 1. baseURL='/api':与后端路由前缀对齐;开发时由 Vite 代理转发到 8000 端口,
 *    生产环境则由 Nginx 等反代处理,前端代码无需关心真实后端地址。
 * 2. 请求拦截器:自动从 localStorage 读取 JWT token 并注入 Authorization 头。
 * 3. 响应拦截器:统一剥离后端的 { code, message, data } 外层结构;
 *    收到 401 时自动清除 token 并跳转登录页。
 * 4. 错误统一弹 message 提示,业务层无需到处写 try/catch 提示逻辑。
 */

/**
 * antd v5 推荐通过 App.useApp() 获取 message 实例以保持主题;
 * 但 axios 拦截器运行在 React 树之外,无法使用 hook。
 * 这里通过一个可被组件设置的 holder 注入运行时的 message 实例,
 * 若未注入则回退到静态方法(AppLayout 在挂载时会调用 setMessageApi 注入)。
 */
let messageApi = staticMessage

/** 由布局组件调用,把运行时的 message 实例注入进来 */
export function setMessageApi(api) {
  messageApi = api
}

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 15000, // 15s 超时,覆盖大多数异常网络场景
})

// ---------------- 请求拦截器 ----------------
// 自动注入 JWT token(登录鉴权)
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------- 响应拦截器 ----------------
// 统一处理后端响应结构 { code, message, data } 与各类 HTTP 错误
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 后端约定 code === 0 表示成功
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0) {
        // 业务错误:弹出提示并 reject,让业务层 catch 到
        messageApi.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || 'Error'))
      }
      // 成功:剥离外层,只返回 data
      return res.data
    }
    // 非标准结构(如直接返回的纯数据),原样返回
    return res
  },
  (error) => {
    // HTTP 层错误(4xx/5xx)处理:把后端的 detail/message 翻译成友好提示
    let msg = error.message || '网络异常'
    if (error.response) {
      const status = error.response.status
      // 401 未授权:token 无效/过期,清除登录状态并跳转登录页
      if (status === 401) {
        clearAuth()
        // 避免在登录页本身触发跳转(循环)
        if (!window.location.pathname.includes('/login')) {
          messageApi.warning('登录已过期,请重新登录')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
      // 优先取后端返回的具体错误信息(detail 是 FastAPI 的字段名)
      const detail = error.response.data?.detail || error.response.data?.message
      if (status === 404) msg = detail || '资源不存在'
      else if (status === 409) msg = detail || '数据冲突(用户名或邮箱已存在)'
      else if (status === 422) msg = detail || '请求参数校验失败'
      else if (status >= 500) msg = detail || '服务器错误,请稍后再试'
      else msg = detail || msg
    }
    messageApi.error(msg)
    return Promise.reject(error)
  },
)

export default request
