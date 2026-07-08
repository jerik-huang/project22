# 后端服务 (FastAPI)

## 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

## 2. 配置数据库连接

复制示例配置并填入你本机的 MySQL 信息:

```bash
cp .env.example .env
```

编辑 `.env`,主要修改 `DB_PASSWORD` 与 `DB_NAME`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=user_db
```

## 3. 初始化数据库

执行项目根目录下的 `database/init.sql`:

```bash
mysql -u root -p < ../database/init.sql
```

> 启动时后端也会调用 `create_all` 自动创建缺失的表,但**库 `user_db` 必须先由 init.sql 建好**。

## 4. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后:
- API 文档(Swagger UI):http://localhost:8000/docs
- 健康检查:http://localhost:8000/health

## API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/users` | 创建用户 |
| GET | `/api/users` | 用户列表(支持 keyword/gender/分页) |
| GET | `/api/users/{id}` | 查询单个用户 |
| PUT | `/api/users/{id}` | 更新用户 |
| DELETE | `/api/users/{id}` | 删除用户 |

所有接口统一返回 `{ code, message, data }`。
