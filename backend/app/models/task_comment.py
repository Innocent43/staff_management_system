from datetime import datetime

from sqlalchemy import ForeignKey,Text,func,DateTime
from sqlalchemy.orm import mapped_column,Mapped,relationship

from app.models.membership import Membership

from app.db.session import Base

class TaskComment(Base):
    __tablename__="task_comments"

    id: Mapped[int]=mapped_column(primary_key=True)
    business_id: Mapped[int]=mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))
    task_id: Mapped[int]=mapped_column(ForeignKey("tasks.id",ondelete="CASCADE"), index=True)
    author_id: Mapped[int]=mapped_column(ForeignKey("memberships.id"))
    body: Mapped[str]=mapped_column(Text)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now())
    author: Mapped[Membership]=relationship()
    