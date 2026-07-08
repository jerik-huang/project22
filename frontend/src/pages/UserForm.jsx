import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Radio,
  Result,
  Skeleton,
  Space,
  Typography,
  App as AntdApp,
} from 'antd'
import {
  ArrowLeftOutlined,
  FormOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { createUser, getUser, updateUser } from '../api/user'

/**
 * 用户新增 / 编辑共用表单页。
 *
 * 通过路由参数判断模式:
 *  - /users/new        → 新增(无 id)
 *  - /users/:id/edit   → 编辑(有 id,需先加载已有数据回填)
 *
 * 校验规则:
 *  - 用户名:必填,2-50 字符,仅字母/数字/下划线;
 *  - 邮箱:必填,需符合邮箱格式;
 *  - 昵称:选填,最多 50 字符;
 *  - 手机号:选填,允许 +/数字/-/空格,长度 6-20;
 *  - 性别:三选一(男/女/其他)。
 * 提交成功后自动跳回列表页。
 */
export default function UserForm() {
  const { id } = useParams()
  const isEdit = Boolean(id) // 是否为编辑模式
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false) // 提交中(控制按钮 loading)
  const [loading, setLoading] = useState(isEdit)     // 编辑模式下加载已有数据
  const [notFound, setNotFound] = useState(false)    // 编辑的目标用户不存在

  // 编辑模式:进入页面后先拉取用户数据回填表单
  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      try {
        setLoading(true)
        const data = await getUser(id)
        form.setFieldsValue(data) // 回填到表单
      } catch {
        setNotFound(true) // 用户不存在(如被删除)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit, form])

  /** 表单提交:创建或更新用户 */
  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      if (isEdit) {
        await updateUser(id, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('创建成功')
      }
      navigate('/') // 成功后跳回列表页
    } catch {
      /* 校验/冲突错误已由 axios 拦截器统一提示 */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      {/* ---- 页头:返回 + 标题 + 副标题 ---- */}
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
              <FormOutlined style={{ color: '#1677ff' }} />
              {isEdit ? '编辑用户' : '新增用户'}
            </h1>
            <p className="page-subtitle">
              {isEdit ? '修改用户信息,标 * 为必填项' : '填写以下信息创建新用户,标 * 为必填项'}
            </p>
          </div>
        </Space>
      </div>

      {/* ---- 内容区:骨架屏 / 404 / 表单 ---- */}
      <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
        {notFound ? (
          // 编辑的目标用户不存在:显示 404 结果页
          <Card style={{ maxWidth: 640 }}>
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
        ) : (
          <Card style={{ maxWidth: 640 }}>
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
                  prefix={<IdcardOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="登录名,如 zhangsan"
                  size="large"
                />
              </Form.Item>

              {/* 邮箱:type="email" 由 AntD 内置校验邮箱格式 */}
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

              {/* 昵称:选填,tooltip 给出说明 */}
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
                    {isEdit ? '保存修改' : '创建用户'}
                  </Button>
                  <Button size="large" onClick={() => navigate(-1)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Skeleton>
    </div>
  )
}
