import request from './request'

/**
 * 认证相关 API 封装。
 *
 * 后端路由前缀:/api/auth
 * 后端统一返回 { code, message, data },已在 request 拦截器中剥离,
 * 因此这里的 Promise 直接 resolve 出 data 部分。
 *
 * Token 存储策略:
 * - 登录成功后,由调用方(页面)自行将 token 存入 localStorage;
 * - request 拦截器在每次请求时自动从 localStorage 读取并注入 Authorization 头;
 * - 登出时由调用方清除 localStorage 中的 token。
 */

/** localStorage 中存储 token 的键名 */
export const TOKEN_KEY = 'access_token'
/** localStorage 中存储用户信息的键名 */
export const USER_KEY = 'current_user'

/**
 * 用户注册
 * @param {Object} data 注册信息
 * @returns {Promise<User>} 新注册的用户信息
 */
export function register(data) {
  return request.post('/auth/register', data)
}

/**
 * 用户登录
 * @param {Object} data 登录信息 { username, password }
 * @returns {Promise<{access_token, token_type, user}>} token 和用户信息
 */
export function login(data) {
  return request.post('/auth/login', data)
}

/**
 * 获取当前登录用户信息(需 token)
 * @returns {Promise<User>} 当前用户信息
 */
export function getCurrentUser() {
  return request.get('/auth/me')
}

// ============================================================
// 本地 token / 用户信息管理(纯前端,不调用后端)
// ============================================================

/** 存储 token 到 localStorage */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 读取 localStorage 中的 token */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/** 清除 token 和用户信息 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
