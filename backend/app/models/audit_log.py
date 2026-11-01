from datetime import datetime

from sqlalchemy import DateTime,ForeignKey,Index,String,func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped,mapped_column

from app.db.session import Base


class AuditLog(Base):
    __tablename__="audit_logs"
    __table_args__=(
        Index("ix_audit_business_created", "business_id","created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id",ondelete="CASCADE"))

    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id",ondelete="SET NULL"))

    action: Mapped[str]=mapped_column(String(60))

    entity_type: Mapped[str]=mapped_column(String(60))
    entity_id: Mapped[int | None]=mapped_column()
    details: Mapped[dict | None]=mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),server_default=func.now())