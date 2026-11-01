from typing import Annotated

from fastapi import APIRouter,Depends,Query,status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership

from app.schemas.task import (
    CommentCreate,CommentFilters,CommentOut,MyTaskFilters,MyTaskOut,TaskCreate,TaskFilters,TaskOut,TaskUpdate,TaskStatusUpdate,
)

from app.security.dependencies import get_current_membership,require_roles
from app.security.rate_limit import check_rate_limit
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))


@router.post("",response_model=TaskOut,status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate,membership: Membership = manager_or_owner,db:Session = Depends(get_db)):
    return task_service.create_task(db,membership,data)


@router.get("",response_model=list[TaskOut])
def list_tasks(filters: Annotated[TaskFilters,Query()],membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return task_service.list_tasks(db,membership,filters)


@router.get("/me", response_model=list[MyTaskOut])
def list_my_tasks(filters: Annotated[MyTaskFilters,Query()],membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db),):
    return task_service.list_my_tasks(db,membership,filters)


@router.get("/{task_id}",response_model=TaskOut)
def get_task(task_id: int, membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db)):
    return task_service.get_task(db,membership,task_id)


@router.patch("/{task_id}",response_model=TaskOut)
def update_task(task_id: int,data: TaskUpdate,membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return task_service.update_task(db,membership,task_id,data)


@router.delete("/{task_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int,membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    task_service.delete_task(db,membership,task_id)



@router.patch("/{task_id}/status", response_model=MyTaskOut)
def update_my_status(task_id: int,data: TaskStatusUpdate,membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db)):
    return task_service.update_my_status(db,membership,task_id,data)


@router.post("/{task_id}/comments",response_model=CommentOut,status_code=status.HTTP_201_CREATED)
def add_comment(task_id: int,data: CommentCreate,membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db)):
    check_rate_limit(f"comment:{membership.id}",30,60)
    return task_service.add_comment(db,membership,task_id,data)

@router.get("/{task_id}/comments", response_model=list[CommentOut])
def list_comments(task_id: int,filters: Annotated[CommentFilters,Query()],membership: Membership = Depends(get_current_membership), db: Session = Depends(get_db)):
    return task_service.list_comment(db,membership,task_id,filters)

    