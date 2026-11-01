from datetime import datetime,time

from sqlalchemy import (
    CheckConstraint,DateTime,ForeignKey,SmallInteger,String,Time,UniqueConstraint,func
)

from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped,mapped_column

from app.db.session import Base


class WorkSchedule(Base):
    __tablename__="work_schedules"
    __table_args__=(
        UniqueConstraint("business_id", "name", name="uq_schedule_business_name"),
        CheckConstraint("break_minutes >= 0",name="ck_schedule_break_minutes"),
        CheckConstraint("grace_minutes >= 0", name="ck_schedule_grace_minutes"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))

    name: Mapped[str]=mapped_column(String(100))

    start_time: Mapped[time] = mapped_column(Time)

    end_time: Mapped[time] = mapped_column(Time)

    break_minutes: Mapped[int] = mapped_column(default=0)

    grace_minutes: Mapped[int] = mapped_column(default=0)

    workdays: Mapped[list[int]] = mapped_column(ARRAY(SmallInteger))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())