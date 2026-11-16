
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class WorkplaceQR(Base):
    __tablename__ = "workplace_qrs"

    __table_args__ = (
        UniqueConstraint(
            "business_id",
            "name",
            name="uq_workplace_business_name",
        ),
        CheckConstraint(  "geofence_radius_m BETWEEN 10 AND 1000",
        name="ck_workplace_geofence_radius",),
        CheckConstraint(
    "(latitude IS NULL AND longitude IS NULL) OR "
    "(latitude IS NOT NULL AND longitude IS NOT NULL)",
    name="ck_workplace_coordinates_together",
),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE")
    )

    name: Mapped[str] = mapped_column(String(100))

    secret: Mapped[str] = mapped_column(String(64))

    active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Workplace GPS coordinates.
    # Both values remain NULL until the owner configures the location.
    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Maximum distance from the workplace allowed for attendance.
    geofence_radius_m: Mapped[int] = mapped_column(
        Integer,
        default=100,
        server_default="100",
    )

    # Whether employees must pass GPS verification at this workplace.
    require_location_verification: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
