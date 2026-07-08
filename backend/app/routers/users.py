"""用户 CRUD 路由。

提供 5 个 RESTful 接口(均挂载在 /api/users 下):
    POST   /api/users          创建用户
    GET    /api/users          用户列表(支持关键字搜索 + 性别筛选 + 分页)
    GET    /api/users/{id}     查询单个用户
    PUT    /api/users/{id}     更新用户
    DELETE /api/users/{id}     删除用户

所有接口统一返回 ApiResponse 结构 { code, message, data }。
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    ApiResponse,
    PageMeta,
    UserCreate,
    UserListData,
    UserOut,
    UserUpdate,
)

# 路由对象:prefix 决定统一前缀,tags 用于 Swagger 文档分组
router = APIRouter(prefix="/users", tags=["用户管理"])


def _get_user_or_404(db: Session, user_id: int) -> User:
    """按 id 查询用户,不存在则抛 404。

    抽成工具函数,避免在 get/update/delete 三处重复写"查询+判断"逻辑。
    """
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"用户 id={user_id} 不存在")
    return user


# ============================================================
# 1. 创建用户
# ============================================================
@router.post("", response_model=ApiResponse[UserOut], status_code=201, summary="创建用户")
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> ApiResponse[UserOut]:
    """创建新用户。

    - payload 由 Pydantic 自动校验(用户名长度、邮箱格式、性别枚举等);
    - 写入时若触发唯一键冲突(用户名/邮箱重复),捕获 IntegrityError 返回 409。
    """
    # model_dump() 把 Pydantic 模型转成字典,解包后直接作为 ORM 构造参数
    user = User(**payload.model_dump())
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        # 唯一键冲突:用户名或邮箱已存在
        db.rollback()
        raise HTTPException(status_code=409, detail="用户名或邮箱已存在") from exc
    db.refresh(user)  # 刷新以拿到数据库生成的 id、created_at 等字段
    return ApiResponse(data=UserOut.model_validate(user))


# ============================================================
# 2. 用户列表(分页 + 搜索 + 筛选)
# ============================================================
@router.get("", response_model=ApiResponse[UserListData], summary="获取用户列表")
def list_users(
    keyword: str | None = Query(None, description="按 用户名/昵称/邮箱/手机号 模糊搜索"),
    gender: str | None = Query(None, description="按性别筛选: male/female/other"),
    page: int = Query(1, ge=1, description="页码,从 1 开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
) -> ApiResponse[UserListData]:
    """分页查询用户列表,支持关键字模糊搜索与性别筛选。"""
    # 基础查询语句
    stmt = select(User)

    # 关键字搜索:在 用户名/昵称/邮箱/手机号 四个字段上做 OR 模糊匹配
    if keyword:
        like = f"%{keyword}%"
        stmt = stmt.where(
            or_(
                User.username.like(like),
                User.nickname.like(like),
                User.email.like(like),
                User.phone.like(like),
            )
        )

    # 性别精确筛选
    if gender:
        stmt = stmt.where(User.gender == gender)

    # 先算总数(基于带 where 的子查询,保证与筛选后的列表一致)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    # 再取当前页数据:按 id 倒序(最新数据在前),用 offset/limit 分页
    items = list(
        db.scalars(
            stmt.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
        )
    )

    return ApiResponse(
        data=UserListData(
            items=[UserOut.model_validate(u) for u in items],
            meta=PageMeta(page=page, page_size=page_size, total=total),
        )
    )


# ============================================================
# 3. 查询单个用户
# ============================================================
@router.get("/{user_id}", response_model=ApiResponse[UserOut], summary="查询单个用户")
def get_user(user_id: int, db: Session = Depends(get_db)) -> ApiResponse[UserOut]:
    """按 id 查询单个用户的详情。"""
    user = _get_user_or_404(db, user_id)
    return ApiResponse(data=UserOut.model_validate(user))


# ============================================================
# 4. 更新用户
# ============================================================
@router.put("/{user_id}", response_model=ApiResponse[UserOut], summary="更新用户")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
) -> ApiResponse[UserOut]:
    """更新用户信息(部分更新)。

    关键点:使用 exclude_unset=True,只更新请求中真正传入的字段,
    未传的字段保持原值不变(PATCH 语义,尽管方法为 PUT)。
    """
    user = _get_user_or_404(db, user_id)

    # 只取用户实际提交过的字段,避免把未传的字段误置为 None
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        # 改成已存在的用户名/邮箱同样会触发唯一键冲突
        db.rollback()
        raise HTTPException(status_code=409, detail="用户名或邮箱已存在") from exc
    db.refresh(user)
    return ApiResponse(data=UserOut.model_validate(user))


# ============================================================
# 5. 删除用户
# ============================================================
@router.delete("/{user_id}", response_model=ApiResponse[UserOut], summary="删除用户")
def delete_user(user_id: int, db: Session = Depends(get_db)) -> ApiResponse[UserOut]:
    """删除指定用户,返回被删除的用户快照(便于前端做"撤销"等提示)。"""
    user = _get_user_or_404(db, user_id)
    # 先序列化快照,删除后对象将失效,无法再序列化
    snapshot = UserOut.model_validate(user)
    db.delete(user)
    db.commit()
    return ApiResponse(data=snapshot, message="删除成功")
