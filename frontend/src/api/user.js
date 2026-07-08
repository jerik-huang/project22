import request from './request'

/**
 * 用户相关 API 封装。
 *
 * 后端统一返回 { code, message, data },已在 request 拦截器中剥离,
 * 因此这里的 Promise 直接 resolve 出 data 部分:
 *   - listUsers   → { items: User[], meta: { page, page_size, total } }
 *   - 其余 CRUD   → User 对象
 */

/**
 * 创建用户
 * @param {Object} data { username, email, gender, nickname?, phone? }
 * @returns {Promise<User>}
 */
export function createUser(data) {
  return request.post('/users', data)
}

/**
 * 获取用户列表(分页 + 搜索 + 筛选)
 * @param {Object} params 查询参数
 * @param {string} [params.keyword] 关键字(用户名/昵称/邮箱/手机号)
 * @param {string} [params.gender]  性别筛选 male/female/other
 * @param {number} [params.page=1]  页码
 * @param {number} [params.page_size=10] 每页条数
 * @returns {Promise<{ items: User[], meta: PageMeta }>}
 */
export function listUsers(params = {}) {
  return request.get('/users', { params })
}

/**
 * 查询单个用户详情
 * @param {number|string} id 用户 ID
 * @returns {Promise<User>}
 */
export function getUser(id) {
  return request.get(`/users/${id}`)
}

/**
 * 更新用户(部分字段更新,只改传入的字段)
 * @param {number|string} id 用户 ID
 * @param {Object} data 要修改的字段
 * @returns {Promise<User>}
 */
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

/**
 * 删除用户
 * @param {number|string} id 用户 ID
 * @returns {Promise<User>} 被删除的用户快照
 */
export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}
