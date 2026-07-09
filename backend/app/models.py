"""ORM 模型定义。

这里的 User 模型对应 MySQL 中的 users 表,
使用 MySQL 自增 BIGINT 作为主键(满足需求约定)。
"""
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    """用户表:对应 MySQL 的 users 表。

    主键 id 为自增 BIGINT(满足"用户表使用 MySQL 自增 ID 作为主键"的需求)。
    username / email 建立唯一索引,保证登录名和邮箱不重复。
    """

    __tablename__ = "users"

    # 主键:BIGINT 自增(范围比 INT 更大,适合长期增长的系统)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # 登录名:唯一、非空,加索引便于按用户名检索
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, comment="登录名")

    # 邮箱:唯一、非空,加索引
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True, comment="邮箱")

    # 密码哈希:存储经 bcrypt 加密后的密码,绝不能存明文
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="密码哈希")

    # 性别:使用 ENUM 约束取值范围,默认 other
    gender: Mapped[str] = mapped_column(
        Enum("male", "female", "other", name="gender_enum"),
        default="other",
        nullable=False,
        comment="性别",
    )

    # 昵称:可选,用于展示
    nickname: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="昵称")

    # 手机号:可选
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="手机号")

    # 创建时间:由数据库在插入时自动填入(server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment="创建时间")

    # 更新时间:插入和每次更新都自动刷新
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间"
    )

    def __repr__(self) -> str:  # pragma: no cover - 仅用于调试打印
        return f"<User id={self.id} username={self.username!r}>"
