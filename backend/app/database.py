"""SQLAlchemy 引擎、会话工厂与依赖注入。

本模块负责:
1. 创建全局唯一的 Engine 与 SessionLocal 会话工厂;
2. 定义所有 ORM 模型的基类 Base;
3. 提供 get_db 依赖,让 FastAPI 在每个请求中分配独立的数据库会话。
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

# 全局引擎:整个应用共享一个连接池
# - pool_pre_ping:借出连接前先 ping 一下,避免使用已失效的长连接
# - pool_recycle:连接每 3600 秒回收一次,防止 MySQL 端 8 小时空闲断开导致报错
# - echo=False:不打印底层 SQL(调试时可改为 True)
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

# 会话工厂:autoflush=False 避免查询时意外触发 flush,autocommit=False 由我们手动控制事务
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。

    继承 DeclarativeBase(SQLAlchemy 2.0 新风格),
    各模型在 models.py 中定义 __tablename__ 与字段。
    """


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖:每个请求分配一个独立的数据库会话。

    用法(在路由函数签名中):
        def list_users(db: Session = Depends(get_db)): ...

    - yield 之前:创建会话;
    - yield:把会话交给路由使用;
    - yield 之后(无论成功或异常):关闭会话,归还连接。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
