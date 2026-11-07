from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minute: int = 720
    redis_url: str = "redis://localhost:6379/0"
    frontend_url: str = "http://localhost:3000"
    vanilla_frontend: str = "http://127.0.0.1:5500"

    
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    email_from: str = "no-reply@localhost"


    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

