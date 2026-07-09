import { useState } from 'react'
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Radio,
  Space,
} from 'antd'
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { register } from '../api/auth'

/**
 * 用户注册页面(套在 AppLayout 内,与新增/编辑用户页保持统一视觉风格)。
 *
 * 校验规则(与后端 RegisterRequest 对齐):
 *  - 用户名:必填,2-50 字符,仅字母/数字/下划线;
 *  - 邮箱:必填,需符合邮箱格式;
 *  - 密码:必填,至少 6 位;
 *  - 确认密码:必填,需与密码一致;
 *  - 昵称:选填,最多 50 字符;
 *  - 手机号:选填;
 *  - 性别:三选一,默认"其他"。
 *
 * 提交成功后弹出提示并跳转到用户列表页。
 */
export default function Register() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false) // 提交中(控制按钮 loading)

  /** 表单提交:调用注册接口 */
  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      await register(values)
      message.success('注册成功!欢迎加入')
      navigate('/') // 成功后跳转到用户列表页
    } catch {
      /* 校验/冲突错误已由 axios 拦截器统一弹出提示 */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      {/* ---- 页头:返回 + 标题 + 副标题(与 UserForm 页保持一致) ---- */}
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
              <SolutionOutlined style={{ color: '#1677ff' }} />
              用户注册
            </h1>
            <p className="page-subtitle">填写以下信息完成注册,标 * 为必填项</p>
          </div>
        </Space>
      </div>

      {/* ---- 内容区:注册表单卡片(水平居中) ---- */}
      <Card style={{ maxWidth: 640, margin: '0 auto' }}>
        {/*
          requiredMark="optional":必填项标注更柔和(显示"选填"而非星号)
          layout="vertical":标签在输入框上方,移动端更友好
        */}
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          initialValues={{ gender: 'other' }}
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 用户名:仅字母/数字/下划线 */}
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 50, message: '长度需在 2-50 个字符之间' },
              { pattern: /^[A-Za-z0-9_]+$/, message: '仅支持字母、数字、下划线' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="登录名,如 zhangsan"
              size="large"
            />
          </Form.Item>

          {/* 邮箱 */}
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
              placeholder="name@example.com"
              size="large"
            />
          </Form.Item>

          {/* 密码:至少 6 位 */}
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 64, message: '密码长度至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="至少 6 位密码"
              size="large"
            />
          </Form.Item>

          {/* 确认密码:需与密码一致 */}
          <Form.Item
            label="确认密码"
            name="confirm_password"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="再次输入密码"
              size="large"
            />
          </Form.Item>

          {/* 昵称:选填 */}
          <Form.Item
            label="昵称"
            name="nickname"
            tooltip="用于展示的友好名称"
            rules={[{ max: 50, message: '最多 50 个字符' }]}
          >
            <Input
              prefix={<SmileOutlined style={{ color: '#9ca3af' }} />}
              placeholder="选填,如 张三"
              size="large"
            />
          </Form.Item>

          {/* 手机号:选填,自定义正则校验 */}
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^\+?[\d\s-]{6,20}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
              placeholder="选填,如 13800138000"
              size="large"
            />
          </Form.Item>

          {/* 性别:按钮式单选,样式更直观 */}
          <Form.Item label="性别" name="gender">
            <Radio.Group buttonStyle="solid" size="large">
              <Radio.Button value="male">男</Radio.Button>
              <Radio.Button value="female">女</Radio.Button>
              <Radio.Button value="other">其他</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* 提交 / 取消按钮 */}
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space>
              <Button type="primary" htmlType="submit" size="large" loading={submitting}>
                注册
              </Button>
              <Button size="large" onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
