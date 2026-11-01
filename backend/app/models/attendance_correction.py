from datetime import datetime

from sqlalchemy import DateTime,Enum,ForeignKey,Text,func
from sqlalchemy.orm import Mapped,mapped_column

from app.db.session import Base
from app.models.enums import CorrectionAction

class AttendanceCorrection(Base):
    __tablename__="attendance_corrections"

    id: Mapped[int]=mapped_column(primary_key=True)
    business_id:Mapped[int]=mapped_column(ForeignKey("businesses.id",ondelete="CASCADE"),index=True)

    event_id: Mapped[int]=mapped_column(ForeignKey("attendance_events.id",ondelete="CASCADE"),index=True)

    corrected_by_id: Mapped[int]=mapped_column(ForeignKey("memberships.id"))
    action: Mapped[CorrectionAction]=mapped_column(Enum(CorrectionAction, native_enum=False,length=20))

    old_occurred_at: Mapped[datetime | None]=mapped_column(DateTime(timezone=True))
    new_occurred_at: Mapped[datetime | None]=mapped_column(DateTime(timezone=True))
    reason: Mapped[str]=mapped_column(Text)

    created_at: Mapped[datetime]=mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
