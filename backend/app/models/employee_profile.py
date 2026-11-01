from datetime import datetime,date
from decimal import Decimal

from sqlalchemy import (
    DateTime,Date,Enum,ForeignKey,Numeric,String,UniqueConstraint,func
)
from sqlalchemy.orm import Mapped,mapped_column,relationship

from app.db.session import Base
from app.models.business import Business
from app.models.enums import WageType
from app.models.membership import Membership
from app.models.work_schedule import WorkSchedule



class EmployeeProfile(Base):
    __tablename__="employee_profiles"
    __table_args__=(UniqueConstraint("business_id", "staff_code", name="uq_profile_business_staff_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int]=mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))
    membership_id: Mapped[int]=mapped_column(ForeignKey("memberships.id", ondelete="CASCADE"),unique=True)
    schedule_id: Mapped[int | None] = mapped_column(ForeignKey("work_schedules.id"))
    staff_code: Mapped[str | None] =mapped_column(String(30))
    wage_type: Mapped[WageType] = mapped_column(Enum(WageType, native_enum=False, length=20), default=WageType.hourly)
    wage_rate: Mapped[Decimal] = mapped_column(Numeric(12,2), default=Decimal("0.00"))
    start_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] =mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    business: Mapped[Business]=relationship()
    membership: Mapped[Membership]=relationship()
    schedule: Mapped[WorkSchedule]=relationship()
