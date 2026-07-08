# 用户管理系统(React + FastAPI + MySQL)

一个全栈用户管理 CRUD 应用。

- **前端**:React 18 + React Router v6 + Zustand + Axios + Ant Design
- **后端**:FastAPI + SQLAlchemy 2.0 + PyMySQL
- **数据库**:MySQL 8.0+(用户表使用 MySQL 自增 ID 作为主键)

---

## 目录结构

```
project-22/
├── backend/            # FastAPI 后端
│   ├── app/
│   │   ├── main.py     # 应用入口
│   │   ├── config.py   # .env 配置读取
│   │   ├── database.py # SQLAlchemy 引擎/会话
│   │   ├── models.py   # User ORM 模型(自增主键)
│   │   ├── schemas.py  # Pydantic 校验/响应模型
│   │   └── routers/users.py  # 用户 CRUD 路由
│   ├── requirements.txt
│   └── .env.example
├── frontend/           # React 前端
│   ├── src/
│   │   ├── api/        # axios 实例 + 用户 API
│   │   ├── store/      # Zustand 状态
│   │   ├── components/ # 布局
│   │   └── pages/      # 列表 / 表单 / 详情
│   ├── vite.config.js  # 含 /api 代理
│   └── package.json
├── database/init.sql   # 建库建表 + 示例数据
└── README.md
```

## 用户表字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键,自增 |
| username | VARCHAR(50) | 登录名,唯一 |
| email | VARCHAR(100) | 邮箱,唯一 |
| gender | ENUM | male / female / other |
| nickname | VARCHAR(50) | 昵称 |
| phone | VARCHAR(20) | 手机号 |
| created_at / updated_at | DATETIME | 时间戳 |

---

## 快速开始

### 0. 前置要求
- Node.js ≥ 18(本机 v22 )
- Python ≥ 3.10(本机 3.11 )
- MySQL ≥ 8.0(本机 8.0 )

### 1. 初始化数据库

```bash
# 注意:Windows 下必须指定 --default-character-set=utf8mb4,否则示例中文会乱码
mysql --default-character-set=utf8mb4 -u root -p < database/init.sql
```

> 这会创建 `user_db` 库、`users` 表,并插入 3 条示例数据。

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt

# 复制并编辑配置,填入你的 MySQL 密码
cp .env.example .env
#   然后编辑 .env 修改 DB_PASSWORD

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API 文档:http://localhost:8000/docs
- 健康检查:http://localhost:8000/health

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

- 应用地址:http://localhost:5173

> Vite 已配置代理:`/api` → `http://localhost:8000`,无需关心跨域。

---

## 功能清单

-  用户列表(分页、关键字模糊搜索、性别筛选)
-  新增用户(表单校验:用户名/邮箱必填、邮箱与手机号格式)
-  编辑用户
-  删除用户(二次确认)
-  用户详情页
-  后端唯一性约束(用户名/邮箱重复时返回 409 并提示)

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/users` | 创建用户 |
| GET | `/api/users` | 列表(支持 keyword/gender/page/page_size) |
| GET | `/api/users/{id}` | 查询单个用户 |
| PUT | `/api/users/{id}` | 更新用户 |
| DELETE | `/api/users/{id}` | 删除用户 |

统一响应结构:`{ "code": 0, "message": "ok", "data": ... }`

## 常见问题

- **后端启动报数据库连接失败** → 检查 `backend/.env` 的 `DB_PASSWORD`、`DB_NAME`,以及 `database/init.sql` 是否已执行。
- **前端接口 404** → 确认后端已在 8000 端口运行;Vite 代理目标为 `http://localhost:8000`。
