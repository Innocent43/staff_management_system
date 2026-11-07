from datetime import datetime,date
from pydantic import BaseModel,EmailStr,field_validator,Field,ConfigDict
from decimal import Decimal

from app.models.enums import Role,MembershipStatus,WageType
from app.schemas.auth import UserOut

class InviteRequest(BaseModel):
    full_name: str=Field(min_length=2,max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    role: Role = Role.employee

    @field_validator("role")
    @classmethod
    def no_owner_invites(cls,value:Role)->Role:
        if value == Role.owner:
            raise ValueError("You cannot invite someone as owner")
        return value



class inviteResponse(BaseModel):
    membership_id: int
    email: EmailStr
    role: Role
    status: MembershipStatus
    invite_expires_at: datetime


class EmployeeOut(BaseModel):
    id: int
    staff_code: str | None
    wage_type: WageType
    wage_rate: Decimal
    start_date: date | None
    schedule_id: int | None
    role: Role
    status: MembershipStatus
    user: UserOut


class EmployeeUpdate(BaseModel):
    model_config=ConfigDict(extra="forbid",str_strip_whitespace=True)

    staff_code: str | None = Field(default=None,max_length=30)
    start_date: date | None = None
    schedule_id: int | None = None
    wage_type: WageType | None = None
    wage_rate: Decimal | None = Field(default=None,max_digits=12, decimal_places=2)
    role: Role | None = None

    @field_validator("staff_code")
    @classmethod
    def blank_staff_code_to_none(cls,value: str | None)->str | None:
        return value or None

    @field_validator("role")
    @classmethod
    def no_owner_role(cls,value: Role | None)-> Role | None:
        if value == Role.owner:
            raise ValueError("You cannot make someone an owner")
        return value

    