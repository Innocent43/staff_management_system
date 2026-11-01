from zoneinfo import ZoneInfo,ZoneInfoNotFoundError

from pydantic import BaseModel,EmailStr,Field,field_validator,ConfigDict
from app.models.enums import Role

class RegisterRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    timezone: str
    currency: str = Field(default="NGN", min_length=3,max_length=3)
    full_name: str = Field(min_length=2,max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("timezone")
    @classmethod
    def check_timezone(cls,value: str)-> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError("Uknown timezone")
        return value

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    business_id: int | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None


class BusinessOut(BaseModel):
    model_config = ConfigDict(from_attribute=True)

    id: int
    name: str
    timezone: str
    currency: str



class MeResponse(BaseModel):
    user: UserOut
    business: BusinessOut
    role: Role


class AcceptInvitedRequest(BaseModel):
    token: str
    password: str | None = Field(default=None, min_length=8, max_length=128)


class InviteInfoResponse(BaseModel):
    business_name: str
    full_name: str
    email: EmailStr
    role: Role
    needs_password: bool
    


