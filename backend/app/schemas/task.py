from datetime import datetime,date

from pydantic import (
    AliasPath,AwareDatetime,BaseModel,ConfigDict,Field,field_validator,model_validator
)

from app.models.enums import TaskPriority,TaskStatus

class TaskCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=2,max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    deadline: AwareDatetime | None = None
    priority: TaskPriority = TaskPriority.medium
    assignee_ids: list[int]= Field(min_length=1,max_length=50)

    @field_validator("assignee_ids")
    @classmethod
    def remove_duplicate_ids(cls,value: list[int])->list[int]:
        return sorted(set(value))


class TaskUpdate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=2,max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    deadline: AwareDatetime | None = None
    priority:TaskPriority | None = None
    assignee_ids: list[int] | None = Field(default=None,min_length=1,max_length=50)

    @field_validator("assignee_ids")
    @classmethod
    def remove_duplicate_ids(cls,value: list[int] | None) -> list[int] | None:
        return None if value is None else sorted(set(value))

    @model_validator(mode="after")
    def required_fields_not_null(self):
        for field in ("title", "priority","assignee_ids"):
            if field in self.model_fields_set and getattr(self,field) is None:
                raise ValueError(f"{field} cannot be empty")
        return self


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskFilters(BaseModel):
    status: TaskStatus | None = None
    employee_id: int | None = None
    priority: TaskPriority | None = None
    overdue: bool = False
    search: str | None = Field(default=None,max_length=100)
    deadline_from: date | None = None
    deadline_to: date | None = None
    limit: int = Field(default=50,ge=1,le=100)
    offset: int = Field(default=0,ge=0)

    @model_validator(mode="after")
    def check_dates(self):
        if self.deadline_from and self.deadline_to and self.deadline_to < self.deadline_from:
            raise ValueError("deadline_to cannot be defore deadline_from")
        return self


class MyTaskFilters(BaseModel):
    status: TaskStatus | None = None
    limit: int = Field(default=50,ge=1,le=100)
    offset: int = Field(default=0,ge=0)



class CommentCreate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    body: str = Field(min_length=1,max_length=2000)


class CommentFilters(BaseModel):
    limit: int = Field(default=50,ge=1,le=100)
    offset: int = Field(default=0,ge=0)


class AssignmentOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    employee_name: str = Field(validation_alias=AliasPath("employee","membership","user","full_name"))
    status: TaskStatus
    completed_at: datetime | None


class TaskOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    deadline: datetime | None
    priority: TaskPriority
    created_at: datetime
    assignments: list[AssignmentOut]


class MyTaskOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    task_id: int
    title: str = Field(validation_alias=AliasPath("task","title"))
    description: str | None = Field(validation_alias=AliasPath("task","description"))
    deadline: datetime | None = Field(validation_alias=AliasPath("task","deadline"))
    priority: TaskPriority = Field(validation_alias=AliasPath("task","priority"))
    status: TaskStatus
    completed_at: datetime | None


class CommentOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id: int
    task_id: int
    body: str
    created_at: datetime
    author_name: str = Field(validation_alias=AliasPath("author","user","full_name"))
    

