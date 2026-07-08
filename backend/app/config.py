"""集中读取 .env 配置。

本模块使用 pydantic-settings 加载 backend/.env 文件,
把环境变量转换为强类型的 Settings 对象,供全应用单例使用。
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env 文件位于 backend/ 目录下(本文件在 backend/app/ 下,故上溯一级)
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """应用配置,字段名与 .env 中的变量名一一对应。

    所有字段都带默认值,即使没有 .env 也能启动(便于本地快速调试);
    正式部署时务必通过 .env 覆盖数据库密码等敏感信息。
    """

    # 通过 env_file 指定配置文件路径;extra="ignore" 忽略 .env 中多余的字段
    model_config = SettingsConfigDict(env_file=str(ENV_PATH), env_file_encoding="utf-8", extra="ignore")

    # ---------- 数据库配置 ----------
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "user_db"

    # ---------- 应用配置 ----------
    APP_HOST: str = "0.0.0.0"  # 监听地址,0.0.0.0 表示对外开放
    APP_PORT: int = 8000

    # ---------- CORS 配置 ----------
    # 允许的前端来源,多个用逗号分隔(开发环境通常是 Vite 的 5173 端口)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def database_url(self) -> str:
        """组装 SQLAlchemy 数据库连接串。

        使用 mysql+pymysql 驱动,charset=utf8mb4 以支持完整的 Unicode(含 emoji)。
        """
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        """把逗号分隔的字符串拆成列表,供 CORSMiddleware 使用。"""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """单例工厂:利用 lru_cache 缓存,整个应用只读取一次 .env 文件。"""
    return Settings()


# 模块级常量,其他文件直接 `from .config import settings` 导入
settings = get_settings()
