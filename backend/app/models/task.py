from datetime import datetime

from sqlalchemy import (
    DateTime,Enum,ForeignKey,Index,String,Text,UniqueConstraint,func
)
from sqlalchemy.orm import Mapped,mapped_column,relationship

from app.db.session import Base
from app.models.employee_profile import EmployeeProfile
from app.models.enums import TaskPriority,TaskStatus

class Task(Base):
    __tablename__="tasks"
    __table_args__=(
        Index("ix_task_business_deadline", "business_id", "deadline"),
    )

    id: Mapped[int]=mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("memberships.id"))
    title: Mapped[str]=mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    priority: Mapped[TaskPriority]=mapped_column(Enum(TaskPriority,native_enum=False, length=20), default=TaskPriority.medium)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assignments: Mapped[list["TaskAssignment"]] = relationship(back_populates="task", cascade="all, delete-orphan")





class TaskAssignment(Base):
    __tablename__="task_assignments"
    __table_args__=(
        UniqueConstraint("task_id", "employee_id", name="uq_assignment_task_employee"),
        Index("ix_assignment_employee_status","employee_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int]=mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"),index=True)

    task_id: Mapped[int]=mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"))
    employee_id: Mapped[int]=mapped_column(ForeignKey("employee_profiles.id",ondelete="CASCADE"))

    status: Mapped[TaskStatus]=mapped_column(Enum(TaskStatus,native_enum=False, length=20), default=TaskStatus.pending)

    assigned_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())

    completed_at: Mapped[datetime | None]=mapped_column(DateTime(timezone=True))

    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    task: Mapped[Task]=relationship(back_populates="assignments")
    employee: Mapped[EmployeeProfile]=relationship()