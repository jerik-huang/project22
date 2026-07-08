import { useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Result,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser } from '../api/user'
import GenderTag from '../components/GenderTag'
import { avatarText, pickAvatarColor } from '../styles/theme'

const { Text } = Typography

/** 时间格式化为本地字符串 */
const fmtTime = (v) => (v ? new Date(v).toLocaleString('zh-CN') : '—')

/**
 * 用户详情页(路由:/users/:id)。
 *
 * 展示单个用户的完整信息:
 *  - 头部:大头像 + 昵称/用户名 + 性别标签;
 *  - 详情:邮箱、手机号、用户名、创建/更新时间(字段前带图标)。
 *
 * 三种状态:
 *  - loading:  加载中显示骨架屏;
 *  - notFound: 用户不存在(如被删除),显示 404 友好提示;
 *  - user:     正常展示详情。
 */
export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // 根据 id 拉取用户详情
  useEffect(() => {
    // active 标志:避免组件卸载后仍执行状态更新(防止内存泄漏警告)
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getUser(id)
        if (active) {
          setUser(data)
          setNotFound(false)
        }
      } catch (e) {
        // 404 等错误:axios 拦截器已弹提示,这里只切换到 notFound 视图
        if (active) setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="page-container">
      {/* ---- 页头:返回 + 标题 + 编辑按钮 ---- */}
      <div className="page-header">
        <Space>
          <Button
            type="text"
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          />
          <div>
            <h1 className="page-title">用户详情</h1>
            <p className="page-subtitle">查看用户的完整信息</p>
          </div>
        </Space>
        {user && (
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            onClick={() => navigate(`/users/${id}/edit`)}
          >
            编辑用户
          </Button>
        )}
      </div>

      {/* ---- 内容区:骨架屏 / 404 / 详情 ---- */}
      <Skeleton loading={loading} active avatar paragraph={{ rows: 5 }}>
        {notFound ? (
          // 用户不存在:显示友好的 404 结果页,引导返回列表
          <Card>
            <Result
              status="404"
              title="用户不存在"
              subTitle={`没有找到 ID 为 ${id} 的用户`}
              extra={
                <Button type="primary" onClick={() => navigate('/')}>
                  返回列表
                </Button>
              }
            />
          </Card>
        ) : user ? (
          <Card style={{ maxWidth: 760 }}>
            {/* ---- 头部:头像 + 昵称/用户名 + 性别 + ID ---- */}
            <div className="detail-profile">
              <Avatar
                className="user-avatar"
                size={72}
                style={{ background: pickAvatarColor(user.username) }}
              >
                <span style={{ fontSize: 30 }}>{avatarText(user.nickname || user.username)}</span>
              </Avatar>
              <div>
                <p className="name">
                  {user.nickname || '—'}
                  <span style={{ marginLeft: 10, fontWeight: 400, color: '#6b7280', fontSize: 16 }}>
                    @{user.username}
                  </span>
                </p>
                <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <GenderTag value={user.gender} />
                  <Text type="secondary">ID: {user.id}</Text>
                </div>
              </div>
            </div>

            {/* ---- 详情字段:每项带图标说明 ---- */}
            <Descriptions column={1} bordered size="middle" style={{ marginTop: 20 }}>
              <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> 手机号</>}>
                {user.phone || <Text type="secondary">未填写</Text>}
              </Descriptions.Item>
              <Descriptions.Item label={<><IdcardOutlined /> 用户名</>}>
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> 创建时间</>}>
                {fmtTime(user.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> 更新时间</>}>
                {fmtTime(user.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}
      </Skeleton>
    </div>
  )
}
