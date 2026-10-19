from datetime import datetime
from sqlalchemy.orm import Mapped,mapped_column
from sqlalchemy import DateTime,String,func


from app.db.session import Base

class Business(Base):
    __tablename__="businesses"

    id: Mapped[int] =  mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    timezone: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now)
    currency: Mapped[str] = mapped_column(String(3), default="NGN")


