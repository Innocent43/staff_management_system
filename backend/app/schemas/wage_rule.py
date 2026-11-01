from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel,ConfigDict,Field


class WageRuleUpdate(BaseModel):
    deduct_scheduled_break: bool
    min_minutes_for_daily_pay: int = Field(ge=1,le=1440)
    overtime_enabled: bool
    overtime_after_minutes: int = Field(ge=1,le=1440)
    overtime_multiplier: Decimal = Field(ge=1,le=5,max_digits=4,decimal_places=2)
    lateness_deduction_enabled: bool
    lateness_deduction_per_minute: Decimal = Field(ge=0,max_digits=10,decimal_places=2)



class WageRuleOut(WageRuleUpdate):
    model_config=ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime