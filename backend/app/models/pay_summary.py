from datetime import date,datetime

from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,Date,DateTime,Enum,ForeignKey,Index,Numeric,Text,UniqueConstraint,func
)

from sqlalchemy.orm import Mapped,mapped_column,relationship
from sqlalchemy.dialects.postgresql import JSONB


from app.db.session import Base
from app.models.employee_profile import EmployeeProfile
from app.models.enums import PayStatus


class PaySummary(Base):
    __tablename__="pay_summaries"
    __table_args__=(
        UniqueConstraint("employee_id","period_start", "period_end", name="uq_pay_employee_period"),
        CheckConstraint("period_end >= period_start",name="ck_pay_period_order"),
        Index("ix_pay_business_period","business_id","period_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    business_id: Mapped[int]=mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))
    employee_id: Mapped[int]=mapped_column(ForeignKey("employee_profiles.id", ondelete="CASCADE"))

    approved_by_id: Mapped[int | None]=mapped_column(ForeignKey("memberships.id"))

    period_start: Mapped[date] =mapped_column(Date)
    period_end: Mapped[date]=mapped_column(Date)

    worked_minutes: Mapped[int]=mapped_column(default=0)
    overtime_minutes: Mapped[int]=mapped_column(default=0)

    late_minutes: Mapped[int]=mapped_column(default=0)

    days_present: Mapped[int]=mapped_column(default=0)

    incomplete_days: Mapped[int] = mapped_column(default=0)

    gross_estimate: Mapped[Decimal]=mapped_column(Numeric(12,2),default=("0.00"))

    adjustments: Mapped[Decimal]=mapped_column(Numeric(12,2),default=Decimal("0.00"))

    adjustment_note: Mapped[str | None]=mapped_column(Text)

    status: Mapped[PayStatus]=mapped_column(Enum(PayStatus, native_enum=False, length=20),default=PayStatus.draft)

    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    calculation_details: Mapped[dict | None]=mapped_column(JSONB)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now())

    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now(), onupdate=func.now())


    employee: Mapped[EmployeeProfile]=relationship()