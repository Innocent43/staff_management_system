from sqlalchemy import func,String,DateTime,ForeignKey,Enum,UniqueConstraint
from sqlalchemy.orm import Mapped,mapped_column,relationship
from datetime import datetime

from app.models.enums import Role,MembershipStatus
from app.models.business import Business
from app.models.user import User
from app.db.session import Base


class Membership(Base):
    __tablename__="memberships"
    __table_args__=(UniqueConstraint("business_id", "user_id", name="uq_membership_business_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"),index=True)
    role: Mapped[Role] = mapped_column(Enum(Role,native_enum=False, length=20))
    status: Mapped[MembershipStatus] = mapped_column(Enum(MembershipStatus, native_enum=False,length=20), default=MembershipStatus.invited)
    invite_token_hash: Mapped[str | None] = mapped_column(String(64), unique=True)
    invite_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    business: Mapped[Business] = relationship()
    user: Mapped[User] = relationship()


