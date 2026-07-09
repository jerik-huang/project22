"""密码安全 & JWT 工具。

两部分:
1. 密码哈希/校验 — 直接使用 bcrypt 库;
2. JWT 签发/解析   — 使用 PyJWT 库。

bcrypt 的特点:
- 自带随机盐值,同一密码每次哈希结果不同;
- 计算成本可调(cost factor),抵御暴力破解。

JWT 的特点:
- 无状态,服务端不需要存 session;
- 包含过期时间,到期自动失效;
- 通过 HMAC 签名防止篡改。
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from .config import settings

# bcrypt 限制:密码最长 72 字节。这里截断以避免超长报错。
_MAX_PASSWORD_BYTES = 72


# ============================================================
# 1. 密码哈希
# ============================================================
def hash_password(plain: str) -> str:
    """对明文密码做 bcrypt 哈希,返回哈希字符串。

    返回值形如 '$2b$12$....',可直接存入数据库的 password_hash 列。
    """
    raw = plain.encode("utf-8")[:_MAX_PASSWORD_BYTES]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文密码与已存储的哈希是否匹配。"""
    raw = plain.encode("utf-8")[:_MAX_PASSWORD_BYTES]
    return bcrypt.checkpw(raw, hashed.encode("utf-8"))


# ============================================================
# 2. JWT 签发 / 解析
# ============================================================
def create_access_token(user_id: int, username: str) -> str:
    """签发 JWT access token。

    payload 结构:
    - sub:   用户 ID(主键)
    - username: 用户名(方便日志/调试)
    - exp:   过期时间(UTC)
    - iat:   签发时间(UTC)
    """
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": user_id,
        "username": username,
        "iat": now,
        "exp": now + timedelta(hours=settings.JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """解析并验证 JWT token。

    返回 payload 字典(验证通过),或 None(验证失败/过期/格式错误)。
    """
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
