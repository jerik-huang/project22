import { useEffect, useRef, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tooltip,
  Typography,
  App as AntdApp,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import EmptyState from '../components/EmptyState'
import GenderTag from '../components/GenderTag'
import { avatarText, pickAvatarColor } from '../styles/theme'

const { Title, Text } = Typography

/**
 * 用户列表页(路由:/)。
 *
 * 功能:
 *  - 分页展示用户(头像 + 用户名/昵称双行);
 *  - 关键字模糊搜索(用户名/昵称/邮箱/手机号);
 *  - 性别筛选;
 *  - 每行提供 查看 / 编辑 / 删除 操作;
 *  - 首次加载用骨架屏,无数据时显示引导性空状态。
 *
 * 数据来自全局 Zustand store(useUserStore),便于在删除后等场景复用。
 */
export default function UserList() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  // 从 store 解构所需的状态与 action
  const {
    users,
    total,
    page,
    pageSize,
    loading,
    keyword,
    gender,
    setKeyword,
    setGender,
    setPage,
    fetchUsers,
    search,
    removeUser,
  } = useUserStore()

  // 搜索框的本地值:输入时只更新本地,回车/点搜索按钮才同步到 store 并发请求
  // 这样可以避免每输入一个字符就触发一次请求(防抖)
  const [keywordInput, setKeywordInput] = useState(keyword)
  // 标记是否为首次加载(首次加载显示骨架屏,后续加载用表格内置 loading)
  const firstLoad = useRef(true)

  // 进入页面拉取第一页数据
  useEffect(() => {
    fetchUsers({ page: 1 })
    firstLoad.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 点击搜索 / 回车:同步关键字并触发查询 */
  const doSearch = () => {
    setKeyword(keywordInput)
    search({ keyword: keywordInput, gender })
  }

  /** 性别筛选变化:立即查询(下拉选择是离散动作,无需防抖) */
  const onGenderChange = (value) => {
    setGender(value)
    search({ keyword, gender: value })
  }

  /** 重置所有筛选条件,回到初始状态 */
  const resetFilters = () => {
    setKeywordInput('')
    setKeyword('')
    setGender(undefined)
    search({ keyword: '', gender: undefined })
  }

  /** 删除用户:调用 store,成功后由 store 刷新列表 */
  const handleDelete = async (id) => {
    try {
      await removeUser(id)
      message.success('删除成功')
    } catch {
      /* 错误提示已由 axios 拦截器统一处理 */
    }
  }

  // 是否处于筛选中(用于区分空状态的两种文案)
  const hasFilter = Boolean(keyword || gender)
  // 是否需要显示空状态(非加载中且列表为空)
  const showEmpty = !loading && users.length === 0

  // 表格列定义
  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 260,
      // 用头像 + 双行文字(用户名 + 昵称)展示,信息更丰富
      render: (_, record) => (
        <Space>
          <Avatar
            className="user-avatar"
            size={36}
            style={{ background: pickAvatarColor(record.username) }}
          >
            {avatarText(record.nickname || record.username)}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
            <Text strong>{record.username}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.nickname || '—'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 240,
      ellipsis: { showTitle: false }, // 超长省略,并用 Tooltip 显示完整内容
      render: (v) => (
        <Tooltip title={v} placement="topLeft">
          <span>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 150,
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 100,
      render: (v) => <GenderTag value={v} />,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (v) => (v ? new Date(v).toLocaleDateString('zh-CN') : '—'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',       // 固定在右侧,横向滚动时始终可见
      align: 'center',
      // 三个图标按钮 + Tooltip 说明;删除带二次确认
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="查看详情">
            <Button type="text" className="row-action-btn" icon={<EyeOutlined />} onClick={() => navigate(`/users/${record.id}`)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" className="row-action-btn" icon={<EditOutlined />} onClick={() => navigate(`/users/${record.id}/edit`)} />
          </Tooltip>
          <Popconfirm
            title="确认删除该用户?"
            description={`将删除用户 ${record.username}`}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="删除">
              <Button type="text" className="row-action-btn" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* ---- 页头:标题 + 副标题 + 新增按钮 ---- */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserOutlined style={{ color: '#1677ff' }} />
            用户列表
          </h1>
          <p className="page-subtitle">共 {loading && firstLoad.current ? '—' : total} 位用户</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate('/users/new')}
        >
          新增用户
        </Button>
      </div>

      <Card className="card-section" styles={{ body: { padding: 16 } }}>
        {/* ---- 工具栏:搜索框 + 性别筛选 + 搜索/重置按钮 ---- */}
        <div className="toolbar">
          <Input
            placeholder="搜索 用户名 / 昵称 / 邮箱 / 手机号"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={doSearch}   // 回车即搜索
            allowClear
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            style={{ width: 320, height: 36 }}
          />
          <Select
            placeholder="性别筛选"
            value={gender}
            onChange={onGenderChange}
            allowClear
            style={{ width: 140 }}
            size="large"
            options={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Button icon={<SearchOutlined />} onClick={doSearch} size="large">
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={resetFilters} size="large">
            重置
          </Button>
        </div>

        {/* ---- 表格区域 ----
            首次加载用骨架屏(progressive-loading 规则,体验优于整页转圈);
            后续加载用表格内置 loading;
            无数据时用 EmptyState 给出引导。 */}
        {firstLoad.current && loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={users}
            loading={loading}
            scroll={{ x: 1040 }}
            locale={{
              emptyText: showEmpty ? (
                <EmptyState
                  type={hasFilter ? 'search' : 'empty'}
                  onReset={resetFilters}
                />
              ) : undefined,
            }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,    // 允许切换每页条数
              showQuickJumper: true,    // 快速跳页
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setPage(p, ps)
                fetchUsers({ page: p, page_size: ps })
              },
            }}
          />
        )}
      </Card>
    </div>
  )
}
