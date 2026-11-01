from datetime import datetime,date
from decimal import Decimal

from pydantic import AliasPath,BaseModel,ConfigDict,Field,model_validator

from app.models.enums import PayStatus

MAX_PERIOD_DAYS = 92


class PayGenerateRequest(BaseModel):
    period_start: date
    period_end: date
    employee_id: int | None = None

    @model_validator(mode='after')
    def check_period(self):
        if self.period_end < self.period_start:
            raise ValueError("period_end cannot be before period_start")
        if (self.period_end - self.period_start).days >= MAX_PERIOD_DAYS:
            raise ValueError(f"A pay period cannot be longer than {MAX_PERIOD_DAYS} days")
        return self




class PayAdjustment(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    adjustments: Decimal = Field(max_digits=12,decimal_places=2)
    adjustment_note: str | None = Field(default=None, max_length=500)

    @model_validator(mode='after')
    def note_needed(self):
        if self.adjustments != 0 and not self.adjustment_note:
            raise ValueError("Add a note explaining the adjustment")
        return self


class PaySummaryFilters(BaseModel):
    employee_id: int | None = None
    status: PayStatus | None = None
    date_from: date | None = None
    date_to: date | None = None

    @model_validator(mode='after')
    def check_dates(self):
        if self.date_from and self.date_to and self.date_to < self.date_from:
            raise ValueError("date_to cannot be before date_from")
        return self



class PaySummaryListFilters(PaySummaryFilters):
    limit: int = Field(default=50,ge=1,le=100)
    offset: int = Field(default=0,ge=0)



class PayFigures(BaseModel):
    worked_minutes: int
    overtime_minutes: int
    late_minutes: int
    days_present: int
    incomplete_days: int
    gross_estimate: Decimal
    calculation_details: dict




class PaySummaryOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    employee_name: str = Field(validation_alias=AliasPath("employee","membership","user","full_name"))
    period_start: date
    period_end: date
    worked_minutes: int
    overtime_minutes: int
    late_minutes: int
    days_present: int
    incomplete_days: int
    gross_estimate: Decimal
    adjustments: Decimal
    adjustment_note: str | None
    net_estimate: Decimal = Decimal("0.00")
    status: PayStatus
    approved_at: datetime | None
    calculation_details: dict | None


    @model_validator(mode="after")
    def work_out_net(self):
        self.net_estimate = self.gross_estimate + self.adjustments
        return self


class PayGenerateOut(BaseModel):
    summaries: list[PaySummaryOut]
    skipped: list[str]


    
