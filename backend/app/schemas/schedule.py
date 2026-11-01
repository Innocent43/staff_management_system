from datetime import time

from pydantic import BaseModel,ConfigDict,Field,field_validator,model_validator


def clean_workdays(days: list[int])->list[int]:
    if any(day < 0 or day > 6 for day in days):
        raise ValueError("Workdays must be numbers from 0 (Monday) to  6 (Sunday)")
    return sorted(set(days))


class ScheduleCreate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2,max_length=100)
    start_time: time
    end_time: time
    break_minutes: int = Field(default=0,ge=0,le=400)
    grace_minutes: int = Field(default=0,ge=0,le=120)
    workdays: list[int] = Field(min_length=1)

    @field_validator("workdays")
    @classmethod
    def check_wordays(cls,value: list[int])-> list[int]:
        return clean_workdays(value)

    @model_validator(mode="after")
    def check_times(self):
        if self.start_time == self.end_time:
            raise ValueError("Start time and end time cannot be the same")
        return self


class ScheduleUpdate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None,min_length=2, max_length=100)
    start_time: time | None = None
    end_time: time | None = None
    break_minutes: int | None = Field(default=None, ge=0,le=480)
    grace_minutes: int | None = Field(default=None,ge=0,le=120)
    workdays: list[int] | None = Field(default=None, min_length=1)

    @field_validator("workdays")
    @classmethod
    def check_workdays(cls,value: list[int] | None)-> list[int] | None:
        return None if value is None else clean_workdays(value)


class ScheduleOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    name: str
    start_time: time
    end_time: time
    break_minutes: int
    grace_minutes: int
    workdays: list[int]

    