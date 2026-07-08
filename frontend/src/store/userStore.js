import { create } from 'zustand'
import { listUsers, deleteUser as apiDeleteUser } from '../api/user'

/**
 * 用户列表状态管理(Zustand)。
 *
 * 职责:
 * - 集中保存用户列表、分页、查询关键字、loading 等共享状态;
 * - 封装与后端交互的 action(fetchUsers / search / removeUser),
 *   让页面组件只关心"调用 action + 读取 state",不必直接处理 API 细节。
 *
 * 使用方式:
 *   const { users, loading, fetchUsers } = useUserStore()
 */

export const useUserStore = create((set, get) => ({
  // ==================== State ====================
  users: [],          // 当前页的用户列表
  total: 0,           // 符合筛选条件的总条数
  page: 1,            // 当前页码(从 1 开始)
  pageSize: 10,       // 每页条数
  keyword: '',        // 当前搜索关键字
  gender: undefined,  // 当前性别筛选('' / undefined 表示全部)
  loading: false,     // 列表加载状态

  // ==================== Actions ====================

  /** 设置搜索关键字(仅更新状态,不触发请求;由 search() 触发请求) */
  setKeyword: (keyword) => set({ keyword }),

  /** 设置性别筛选 */
  setGender: (gender) => set({ gender }),

  /** 设置分页参数 */
  setPage: (page, pageSize) => set({ page, pageSize: pageSize ?? get().pageSize }),

  /**
   * 拉取用户列表。
   * @param {Object} override 可覆盖默认的查询参数(如 { page: 2, page_size: 20 })
   */
  fetchUsers: async (override = {}) => {
    // 合并当前状态与传入覆盖项,得到本次实际使用的查询参数
    const { page, pageSize, keyword, gender } = { ...get(), ...override }
    set({ loading: true })
    try {
      const data = await listUsers({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,   // 空字符串不传,避免后端当作关键字搜
        gender: gender || undefined,
      })
      // 后端返回结构 { items, meta }
      set({
        users: data?.items ?? [],
        total: data?.meta?.total ?? 0,
        page: data?.meta?.page ?? page,
        pageSize: data?.meta?.page_size ?? pageSize,
        loading: false,
      })
      return data
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  /**
   * 删除用户并自动刷新列表。
   * 智能处理:若删除后当前页空了(且不是第一页),自动回退到上一页。
   */
  removeUser: async (id) => {
    await apiDeleteUser(id)
    const { users, page } = get()
    // 当前页只剩这一条,且不是第一页 → 删除后回退一页,避免看到空白页
    const willBeEmpty = users.length === 1 && page > 1
    await get().fetchUsers({ page: willBeEmpty ? page - 1 : page })
  },

  /**
   * 搜索(关键字/性别变化后调用)。
   * 任何搜索条件改变都应回到第一页,因此强制 page=1。
   */
  search: (override = {}) => get().fetchUsers({ page: 1, ...override }),
}))

export default useUserStore
