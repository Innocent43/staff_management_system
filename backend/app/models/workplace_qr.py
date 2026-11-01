from datetime import datetime

from sqlalchemy import Boolean,DateTime,ForeignKey,String,UniqueConstraint,func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class WorkplaceQR(Base):
    __tablename__="workplace_qrs"
    __table_args__=(
        UniqueConstraint("business_id", "name", name="uq_workplace_business_name"),
    )

    id: Mapped[int]=mapped_column(primary_key=True)
    business_id:Mapped[int]=mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))
    name: Mapped[str]=mapped_column(String(100))
    secret: Mapped[str]=mapped_column(String(64))
    active: Mapped[bool]=mapped_column(Boolean, default=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now(), onupdate=func.now())
    