import { Button, Empty } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

/**
 * 友好的空状态组件。
 *
 * 满足 ui-ux-pro-max 的 empty-states 规则:
 * 不只显示"暂无数据",而是根据场景给出引导操作,降低用户挫败感。
 *
 * 两种模式:
 *  - type="empty":  库里没有任何数据 → 引导"新增第一个用户"
 *  - type="search": 有数据但当前筛选无结果 → 提供"清空筛选条件"
 *
 * 用法:<EmptyState type="search" onReset={() => resetFilters()} />
 */
export default function EmptyState({ type = 'empty', onReset }) {
  const navigate = useNavigate()

  // 是否为"搜索无结果"模式
  const isSearch = type === 'search'

  return (
    <div className="empty-wrap">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: '#6b7280' }}>
            {isSearch ? '没有找到匹配的用户' : '暂无用户数据'}
          </span>
        }
      >
        {/* 根据场景给出不同的引导操作 */}
        {isSearch ? (
          <Button type="link" onClick={onReset}>
            清空筛选条件
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => navigate('/users/new')}
          >
            新增第一个用户
          </Button>
        )}
      </Empty>
    </div>
  )
}
