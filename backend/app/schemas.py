"""Pydantic 请求/响应模型(数据校验与序列化)。

schemas(models) 与 models(ORM) 分离是 FastAPI 的最佳实践:
- models 负责数据库映射;
- schemas 负责对外接口的入参校验、出参序列化,屏蔽内部细节。

这样可以在不暴露 ORM 全貌的同时,精细控制每个接口接受/返回哪些字段。
"""
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

# 泛型类型变量,供 ApiResponse[T] 使用
T = TypeVar("T")


# ============================================================
# 基础响应结构
# ============================================================
class ApiResponse(BaseModel, Generic[T]):
    """统一响应结构。

    所有接口都返回该结构,前端只需按统一格式解析:
        { "code": 0, "message": "ok", "data": ... }

    - code=0 表示成功;非 0 表示业务错误;
    - data 的具体类型由泛型参数 T 决定(如 ApiResponse[UserOut])。
    """

    code: int = 0
    message: str = "ok"
    data: T | None = None


# ============================================================
# 用户相关 schema
# ============================================================
class UserBase(BaseModel):
    """用户公共字段(创建与更新共用的基础字段集)。

    在此集中定义校验规则,UserCreate / UserUpdate 继承后即可复用。
    """

    username: str = Field(..., min_length=2, max_length=50, description="登录名")
    email: EmailStr = Field(..., description="邮箱")  # EmailStr 会自动校验邮箱格式
    gender: str = Field("other", description="性别: male/female/other")
    nickname: str | None = Field(None, max_length=50, description="昵称")
    phone: str | None = Field(None, max_length=20, description="手机号")

    @field_validator("gender")
    @classmethod
    def check_gender(cls, v: str) -> str:
        """校验性别取值,统一转为小写并限定在枚举范围内。"""
        v = (v or "other").lower()
        if v not in {"male", "female", "other"}:
            raise ValueError("gender 必须是 male/female/other 之一")
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str | None) -> str | None:
        """手机号格式校验。

        允许数字、+、-、空格,去掉这些符号后纯数字长度需在 6~20 位之间。
        空值视为"未填写",直接放行。
        """
        if v is None or v == "":
            return None
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.startswith("+"):
            cleaned = cleaned.lstrip("+")
        if not cleaned.isdigit() or not (6 <= len(cleaned) <= 20):
            raise ValueError("手机号格式不正确")
        return v


class UserCreate(UserBase):
    """创建用户请求体:字段与 UserBase 完全一致,单独定义便于未来扩展。"""


class RegisterRequest(BaseModel):
    """用户注册请求体。

    与 UserCreate 的区别:注册时必须设置密码,因此额外携带 password / confirm_password。
    其余公共字段复用 UserBase 的校验逻辑(通过组合而非继承,避免污染 UserCreate)。
    """

    username: str = Field(..., min_length=2, max_length=50, description="登录名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=64, description="密码,至少6位")
    confirm_password: str = Field(..., min_length=6, max_length=64, description="确认密码")
    gender: str = Field("other", description="性别: male/female/other")
    nickname: str | None = Field(None, max_length=50, description="昵称")
    phone: str | None = Field(None, max_length=20, description="手机号")

    @field_validator("gender")
    @classmethod
    def check_gender(cls, v: str) -> str:
        """校验性别取值,统一转为小写并限定在枚举范围内。"""
        v = (v or "other").lower()
        if v not in {"male", "female", "other"}:
            raise ValueError("gender 必须是 male/female/other 之一")
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str | None) -> str | None:
        """手机号格式校验。"""
        if v is None or v == "":
            return None
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.startswith("+"):
            cleaned = cleaned.lstrip("+")
        if not cleaned.isdigit() or not (6 <= len(cleaned) <= 20):
            raise ValueError("手机号格式不正确")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self) -> "RegisterRequest":
        """两次输入的密码必须一致。"""
        if self.password != self.confirm_password:
            raise ValueError("两次输入的密码不一致")
        return self


class UserUpdate(BaseModel):
    """更新用户请求体。

    与 UserBase 不同:更新时所有字段都是可选的(exclude_unset 实现"只改传了的字段")。
    因此这里不继承 UserBase,而是重新定义每个字段为可选。
    """

    username: str | None = Field(None, min_length=2, max_length=50)
    email: EmailStr | None = None
    gender: str | None = None
    nickname: str | None = Field(None, max_length=50)
    phone: str | None = Field(None, max_length=20)

    @field_validator("gender")
    @classmethod
    def check_gender(cls, v: str | None) -> str | None:
        """性别校验(同 UserBase,但允许 None 表示不修改)。"""
        if v is None:
            return None
        v = v.lower()
        if v not in {"male", "female", "other"}:
            raise ValueError("gender 必须是 male/female/other 之一")
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str | None) -> str | None:
        """手机号校验(同 UserBase,但允许 None 表示不修改)。"""
        if v is None or v == "":
            return None
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.startswith("+"):
            cleaned = cleaned.lstrip("+")
        if not cleaned.isdigit() or not (6 <= len(cleaned) <= 20):
            raise ValueError("手机号格式不正确")
        return v


class UserOut(BaseModel):
    """用户响应模型:对外返回时使用的结构。

    model_config 中 from_attributes=True 表示可以从 ORM 对象(如 User 实例)
    直接构造,实现 ORM → Pydantic 的自动转换。
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    gender: str
    nickname: str | None = None
    phone: str | None = None
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    """用户登录请求体。"""

    username: str = Field(..., min_length=1, max_length=50, description="用户名或邮箱")
    password: str = Field(..., min_length=1, max_length=64, description="密码")


class LoginResponse(BaseModel):
    """登录成功响应体:返回 token 和用户信息。"""

    access_token: str = Field(..., description="JWT token")
    token_type: str = Field("bearer", description="token 类型")
    user: UserOut = Field(..., description="当前用户信息")


# ============================================================
# 列表 / 分页
# ============================================================
class PageMeta(BaseModel):
    """分页元信息:当前页、每页条数、总条数。"""

    page: int
    page_size: int
    total: int


class UserListData(BaseModel):
    """列表响应数据:用户列表 + 分页信息。"""

    items: list[UserOut]
    meta: PageMeta
