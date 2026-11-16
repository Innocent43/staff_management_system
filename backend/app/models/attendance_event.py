
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.employee_profile import EmployeeProfile
from app.models.enums import EventSource, EventType


class AttendanceEvent(Base):
    __tablename__ = "attendance_events"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "request_id",
            name="uq_event_employee_request",
        ),
        Index(
            "ix_events_business_occurred",
            "business_id",
            "occurred_at",
        ),
        Index(
            "ix_events_employee_occurred",
            "employee_id",
            "occurred_at",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE")
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employee_profiles.id", ondelete="CASCADE")
    )

    workplace_id: Mapped[int | None] = mapped_column(
        ForeignKey("workplace_qrs.id", ondelete="SET NULL")
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("memberships.id")
    )

    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, native_enum=False, length=20)
    )

    source: Mapped[EventSource] = mapped_column(
        Enum(EventSource, native_enum=False, length=20),
        default=EventSource.qr,
    )

    # Actual attendance event time.
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Time the database recorded the event.
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Employee device location at the time of attendance.
    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Estimated GPS accuracy reported by the device, in metres.
    accuracy_m: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Backend verification result.
    location_verified: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    # Backend-calculated distance from the workplace, in metres.
    distance_from_workplace_m: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Workplace coordinates when this event was recorded.
    workplace_latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    workplace_longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    is_voided: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    request_id: Mapped[str | None] = mapped_column(
        String(64)
    )

    note: Mapped[str | None] = mapped_column(Text)

    employee: Mapped[EmployeeProfile] = relationship()
