"""认证相关路由。

提供注册 / 登录 / 获取当前用户接口(挂载在 /api/auth 下):
    POST /api/auth/register   用户注册
    POST /api/auth/login      用户登录(返回 JWT token)
    GET  /api/auth/me         获取当前登录用户信息(需 Bearer token)

密码安全说明:
- 密码绝不明文存储,使用 bcrypt 进行单向哈希;
- bcrypt 自带盐值(salt),每次哈希结果都不同,能有效抵御彩虹表攻击。

JWT 鉴权说明:
- 登录成功后返回 access_token;
- 前端在后续请求的 Authorization 头中携带 "Bearer <token>";
- 需要登录的路由通过 Depends(get_current_user) 自动校验。

所有接口统一返回 ApiResponse 结构 { code, message, data }。
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import ApiResponse, LoginRequest, LoginResponse, RegisterRequest, UserOut
from ..security import create_access_token, hash_password, verify_password

# 路由对象:挂载在 /api/auth 下(由 main.py 的 prefix="/api" 拼接得到)
router = APIRouter(prefix="/auth", tags=["认证"])


# ============================================================
# 1. 用户注册
# ============================================================
@router.post("/register", response_model=ApiResponse[UserOut], status_code=201, summary="用户注册")
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> ApiResponse[UserOut]:
    """用户注册。

    流程:
    1. Pydantic 已完成基础校验(用户名长度、邮箱格式、密码长度、两次密码一致);
    2. 再次检查用户名/邮箱是否已被占用(提前拦截,给出更友好的错误信息);
    3. 对密码做 bcrypt 哈希后存入 password_hash 字段;
    4. 写入数据库,唯一键冲突作为兜底再捕获一次 IntegrityError。
    """
    # ---- 预检查:用户名 / 邮箱是否已存在 ----
    exists = db.scalar(
        select(User).where(
            (User.username == payload.username) | (User.email == payload.email)
        )
    )
    if exists is not None:
        if exists.username == payload.username:
            raise HTTPException(status_code=409, detail="该用户名已被注册")
        raise HTTPException(status_code=409, detail="该邮箱已被注册")

    # ---- 创建用户 ----
    user = User(
        username=payload.username,
        email=payload.email,
        gender=payload.gender,
        nickname=payload.nickname,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="用户名或邮箱已存在") from exc
    db.refresh(user)

    return ApiResponse(data=UserOut.model_validate(user), message="注册成功")


# ============================================================
# 2. 用户登录
# ============================================================
@router.post("/login", response_model=ApiResponse[LoginResponse], summary="用户登录")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> ApiResponse[LoginResponse]:
    """用户登录。

    流程:
    1. 根据用户名(或邮箱)查询用户;
    2. 校验密码与数据库中的哈希是否匹配;
    3. 匹配成功 → 签发 JWT token,连同用户信息一起返回;
       匹配失败 → 返回 401。

    安全说明:
    - 用户不存在和密码错误返回相同的提示,避免泄露"用户是否存在";
    - 密码不参与响应,响应中的 user 字段不包含 password_hash。
    """
    # 允许用用户名或邮箱登录:username 字段两者都接受
    user = db.scalar(
        select(User).where(
            (User.username == payload.username) | (User.email == payload.username)
        )
    )

    # 统一错误提示:不区分"用户不存在"和"密码错误"
    if user is None or not user.password_hash:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    # 签发 JWT token
    token = create_access_token(user_id=user.id, username=user.username)

    data = LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )
    return ApiResponse(data=data, message="登录成功")


# ============================================================
# 3. 获取当前登录用户
# ============================================================
@router.get("/me", response_model=ApiResponse[UserOut], summary="获取当前登录用户")
def get_me(current_user: User = Depends(get_current_user)) -> ApiResponse[UserOut]:
    """获取当前登录用户信息。

    需要在请求头中携带:
        Authorization: Bearer <token>

    token 无效/过期时返回 401。
    """
    return ApiResponse(data=UserOut.model_validate(current_user), message="OK")
