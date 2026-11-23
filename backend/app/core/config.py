from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minute: int = 720
    redis_url: str = "redis://localhost:6379/0"
    frontend_url: str = "http://localhost:3000"

    
    brevo_api_key: str | None = None
    geoapify_api_key: str | None = None
    
    
    email_from: str = "no-reply@localhost"
    
    #cloudflare R2 storage
    r2_endpoint_url: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None


    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

