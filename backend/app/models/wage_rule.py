from datetime import datetime 
from decimal import Decimal

from sqlalchemy import Boolean,CheckConstraint,DateTime,ForeignKey,Numeric,func
from sqlalchemy.orm import Mapped,mapped_column

from app.db.session import Base

class WageRule(Base):
    __tablename__="wage_rules"
    __table_args__=(
        CheckConstraint("overtime_after_minutes > 0",name="ck_wage_rule_overtime_after"),
        CheckConstraint("overtime_multiplier >= 1", name="ck_wage_rule_multiplier"),
        CheckConstraint("lateness_deduction_per_minute >= 0", name="ck_wage_rule_lateness"),
    )

    id: Mapped[int]=mapped_column(primary_key=True)
    business_id: Mapped[int]=mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"),unique=True)

    deduct_scheduled_break: Mapped[bool]=mapped_column(Boolean,default=True)
    min_minutes_for_daily_pay: Mapped[int]=mapped_column(default=240)

    overtime_enabled: Mapped[bool]=mapped_column(Boolean,default=False)
    overtime_after_minutes: Mapped[int]=mapped_column(default=480)
    overtime_multiplier: Mapped[Decimal]=mapped_column(Numeric(4,2), default=Decimal("1.50"))

    lateness_deduction_enabled: Mapped[bool]=mapped_column(Boolean,default=False)
    lateness_deduction_per_minute: Mapped[Decimal] = mapped_column(Numeric(10,2),default=Decimal("0.00"))

    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())

    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now())