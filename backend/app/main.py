"""FastAPI 应用入口。

职责:
1. 创建 FastAPI 应用实例并设置元信息;
2. 注册 CORS 中间件,允许前端开发服务器跨域访问;
3. 把用户路由统一挂载到 /api 前缀下;
4. 启动时自动创建缺失的表(便于快速演示)。
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, users

# 配置根日志:统一格式,便于排查问题
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("user-mgmt")

# 创建应用:title/description 会展示在 Swagger 文档(/docs)页面
app = FastAPI(
    title="用户管理系统 API",
    description="React + FastAPI + MySQL 全栈用户管理 CRUD",
    version="1.0.0",
)

# ---- CORS 中间件 ----
# 前端(Vite,5173)与后端(8000)端口不同,需放行跨域。
# 生产环境应通过 .env 的 CORS_ORIGINS 收紧到具体域名。
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- 路由注册 ----
# 所有用户相关接口都挂在 /api 下,与前端 axios 的 baseURL 对齐
app.include_router(users.router, prefix="/api")
# 认证相关接口(注册等)挂在 /api/auth 下
app.include_router(auth.router, prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    """启动钩子:按 ORM 模型创建缺失的表。

    这是一种"开发友好"的做法,省去手动建表。
    注意:
    - 它只会"创建不存在的表",不会修改已有表结构(生产环境请使用 Alembic 等迁移工具);
    - 数据库本身(user_db)必须已存在,需先执行 database/init.sql。
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表已就绪")
    except Exception as exc:  # noqa: BLE001
        logger.error("连接/初始化数据库失败:%s", exc)
        logger.error("请检查 backend/.env 中的数据库配置,以及 database/init.sql 是否已执行。")


@app.get("/", tags=["默认"])
def root() -> dict:
    """根路径,返回简单的运行状态提示(便于访问首页时确认服务存活)。"""
    return {"message": "用户管理系统 API 正在运行,文档见 /docs"}


@app.get("/health", tags=["默认"])
def health() -> dict:
    """健康检查端点,可供监控/网关探活使用。"""
    return {"status": "ok"}
