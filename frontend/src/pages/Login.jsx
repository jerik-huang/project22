import { useEffect, useState } from 'react'
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Space,
} from 'antd'
import {
  ArrowLeftOutlined,
  LockOutlined,
  LoginOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * 用户登录页面(套在 AppLayout 内,与注册页保持统一视觉风格)。
 *
 * 校验规则(与后端 LoginRequest 对齐):
 *  - 用户名/邮箱:必填;
 *  - 密码:必填。
 *
 * 提交成功后:
 *  - 由 AuthContext 保存 token 与用户信息;
 *  - 跳转到登录前用户试图访问的页面(from),没有则回首页。
 *
 * 若用户已登录时访问本页,自动重定向到首页,避免重复登录。
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const { login, isAuthenticated, loading } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  // 登录前用户想访问的页面(由 ProtectedRoute 写入 state.from),没有则回首页
  const from = location.state?.from?.pathname || '/'

  // 已登录用户访问登录页:自动跳走
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [loading, isAuthenticated, from, navigate])

  /** 表单提交:调用登录接口 */
  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      const user = await login(values.username, values.password)
      message.success(`欢迎回来,${user.nickname || user.username}!`)
      navigate(from, { replace: true })
    } catch {
      /* 错误提示由 axios 拦截器统一弹出 */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      {/* ---- 页头:返回 + 标题 + 副标题(与 Register 页保持一致) ---- */}
      <div className="page-header">
        <Space>
          <Button
            type="text"
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          />
          <div>
            <h1 className="page-title">
              <LoginOutlined style={{ color: '#1677ff' }} />
              用户登录
            </h1>
            <p className="page-subtitle">登录后即可管理用户信息</p>
          </div>
        </Space>
      </div>

      {/* ---- 内容区:登录表单卡片(水平居中) ---- */}
      <Card style={{ maxWidth: 440, margin: '0 auto' }}>
        <Form
          layout="vertical"
          requiredMark="optional"
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 用户名或邮箱:后端两者均可登录 */}
          <Form.Item
            label="用户名 / 邮箱"
            name="username"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="用户名或邮箱"
              size="large"
              autoComplete="username"
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="密码"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          {/* 提交按钮 + 注册引导 */}
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitting}
                block
              >
                登录
              </Button>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                还没有账号?
                <Link to="/register" style={{ marginLeft: 4 }}>
                  立即注册
                </Link>
              </div>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
