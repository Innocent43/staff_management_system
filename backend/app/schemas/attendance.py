from datetime import datetime,date
from typing import Literal
from pydantic import BaseModel,ConfigDict,Field,model_validator,AwareDatetime

from app.models.enums import EventSource,EventType,CorrectionAction

class ClockRequest(BaseModel):
    qr_token: str
    event_type: EventType
    request_id: str = Field(min_length=8,max_length=64)



class AttendanceOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    event_type: EventType
    source: EventSource
    occurred_at: datetime
    is_voided: bool
    workplace_id: int | None
    note: str | None


class AttendanceStatusOut(BaseModel):
    clocked_in: bool
    since: datetime | None


class AttendanceFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    limit: int = Field(default=50,ge=1,le=100)
    offset: int = Field(default=0,ge=0)

    @model_validator(mode="after")
    def check_dates(self):
        if self.date_from and self.date_to and self.date_to < self.date_from:
            raise ValueError("date_to cannot be before date_from")
        return self


class ManageAttendanceFilters(AttendanceFilters):
    employee_id: int | None = None
    include_voided: bool = False



class ShiftFilters(BaseModel):
    employee_id: int | None = None
    date_from: date
    date_to: date


    @model_validator(mode="after")
    def check_dates(self):
        if self.date_to < self.date_from:
            raise ValueError ("date_to cannot be before date_from")

        if (self.date_to - self.date_from).days > 31:
            raise ValueError("The date range cannot be longer than 31 days")

        return self


class ShiftOut(BaseModel):
    employee_id: int
    employee_name: str
    clock_in: datetime | None
    clock_out: datetime | None
    duration_minutes: int
    late_minutes: int
    flags: list[str]


class TodayRowOut(BaseModel):
    employee_id: int
    employee_name: str
    status: Literal["clocked_in","clocked_out", "not_in"]
    since: datetime | None
    late_minutes: int


class ManualEventCreate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    employee_id: int
    event_type: EventType
    occurred_at: AwareDatetime
    reason: str = Field(min_length=3,max_length=500)


class TimeCorrection(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    occurred_at: AwareDatetime
    reason: str = Field(min_length=3, max_length=500)



class VoidRequest(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    reason: str = Field(min_length=3,max_length=500)


class CorrectionOut(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    id: int
    event_id: int
    corrected_by_id: int
    action: CorrectionAction
    old_occurred_at: datetime | None
    new_occurred_at: datetime | None
    reason: str
    created_at: datetime   
    