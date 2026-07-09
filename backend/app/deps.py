"""FastAPI 依赖注入:获取当前登录用户。

用法(在路由函数参数中):
    @router.get("/me")
    def me(current_user: User = Depends(get_current_user)):
        return current_user

流程:
1. 从 Authorization 头提取 Bearer token;
2. 解码并验证 JWT;
3. 根据 token 中的 user_id 查询数据库;
4. 返回 User 实体(验证失败则抛 401)。
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import decode_access_token

# Bearer token 提取器:自动从 Authorization 头读取
bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """依赖项:解析 JWT 并返回当前登录的 User 实体。

    如果 token 无效/过期,或对应用户不存在,抛出 401 Unauthorized。
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token 无效或已过期,请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token 内容无效",
        )

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    return user
