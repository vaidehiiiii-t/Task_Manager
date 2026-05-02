from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DIRECT_URL: str = ""
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    FRONTEND_URL: str = "http://localhost:3000"
    PORT: int = 8000
    ENVIRONMENT: str = "production"

    class Config:
        env_file = ".env"
        extra = "ignore"



settings = Settings()
