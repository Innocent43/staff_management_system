import logging
from datetime import datetime,timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException,status
from redis.exceptions import RedisError
from rq import Retry
from sqlalchemy import and_,select
from sqlalchemy.orm import Session,contains_eager,selectinload


from app.core.queue import email_queue
from app.core.timezone import local_day_end,local_day_start
from app.models.employee_profile import EmployeeProfile
from app.models.enums import MembershipStatus,Role,TaskStatus
from app.models.membership import Membership
from app.models.task import Task,TaskAssignment
from app.models.task_comment import TaskComment


from app.schemas.task import (
    CommentCreate,CommentFilters,MyTaskFilters,TaskCreate,TaskFilters,TaskStatusUpdate,TaskUpdate
)

from app.services import employee_service
from app.services.audit_service import audit
from app.services.email_service import send_task_assigned_email


logger = logging.getLogger(__name__)


def _load_assignments():
    return (selectinload(Task.assignments).selectinload(TaskAssignment.employee).selectinload(EmployeeProfile.membership).selectinload(Membership.user))


def _get_task(db: Session,actor: Membership, task_id: int)->Task:
    task = db.scalar(select(Task).where(Task.id == task_id,Task.business_id == actor.business_id).options(_load_assignments()))

    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Task not found")
    return task


def _check_can_view(actor: Membership, task: Task)-> None:
    if actor.role in (Role.owner,Role.manager):
        return
    is_assigned = any(a.employee.membership_id == actor.id for a in task.assignments)
    if not is_assigned:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Task not found")



def _get_assignees(db: Session,actor: Membership, employee_ids: list[int])->list[EmployeeProfile]:
    query = (select(EmployeeProfile).join(EmployeeProfile.membership).where(EmployeeProfile.business_id == actor.business_id,EmployeeProfile.id.in_(employee_ids), Membership.status == MembershipStatus.active,).options(selectinload(EmployeeProfile.membership).selectinload(Membership.user)))

    profiles = list(db.scalars(query).all())

    if len(profiles) != len(employee_ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"One or more employees were not found or are not active")
    return profiles


def _format_deadline(deadline: datetime | None, timezone_name: str)->str:
    if deadline is None:
        return "No deadline"
    local_time = deadline.astimezone(ZoneInfo(timezone_name))
    return local_time.strftime("%d %b %Y, %I:%M %p")


def _notify_assignees(actor: Membership,task: Task,profiles: list[EmployeeProfile])->None:
    deadline_text = _format_deadline(task.deadline,actor.business.timezone)

    for profile in profiles:
        if profile.membership_id == actor.id:
            continue
        user = profile.membership.user
        try:
            email_queue.enqueue(
                send_task_assigned_email,
                user.email,
                user.full_name,
                task.title,
                deadline_text,
                retry=Retry(max=3,interval=[10,60,300])
            )
        except RedisError:
            logger.error("Could not queue task email: task_id=%s", task.id,exc_info=True)



def create_task(db: Session,actor: Membership,data: TaskCreate)-> Task:
    profiles = _get_assignees(db,actor,data.assignee_ids)

    task = Task(
        business_id=actor.business_id,
        created_by_id=actor.id,
        assignments=[
            TaskAssignment(business_id=actor.business_id,employee=profile) for profile in profiles
        ],
        **data.model_dump(exclude={"assignee_ids"}),
    )
    db.add(task)
    db.flush()
    audit(db,actor,"task.created",task.id, {"title": task.title, "assignee_ids": data.assignee_ids})
    db.commit()

    task = _get_task(db,actor,task.id)
    _notify_assignees(actor,task,profiles)
    return task


def list_tasks(db: Session, actor: Membership, filters: TaskFilters)->list[Task]:
    timezone_name = actor.business.timezone

    query =(select(Task).where(Task.business_id == actor.business_id).options(_load_assignments()))

    assignment_conditions = []
    if filters.employee_id:
        assignment_conditions.append(TaskAssignment.employee_id == filters.employee_id)
    if filters.status:
        assignment_conditions.append(TaskAssignment.status == filters.status)
    if assignment_conditions:
        query = query.where(Task.assignments.any(and_(*assignment_conditions)))

    if filters.priority:
        query = query.where(Task.priority == filters.priority)
    if filters.search:
        query = query.where(Task.title.ilike(f"%{filters.search}%"))
    if filters.overdue:
        query = query.where(Task.deadline < datetime.now(timezone.utc),Task.assignments.any(TaskAssignment.status != TaskStatus.completed))
    if filters.deadline_from:
        query = query.where(Task.deadline >= local_day_start(filters.deadline_from,timezone_name))
    if filters.deadline_to:
        query = query.where(Task.deadline < local_day_end(filters.deadline_to,timezone_name))
    query = (query.order_by(Task.deadline.asc().nulls_last(), Task.id.desc()).limit(filters.limit).offset(filters.offset))

    return list(db.scalars(query).all())



def list_my_tasks(db: Session,actor: Membership,filters: MyTaskFilters)->list[TaskAssignment]:
    profile = employee_service.get_my_profile(db,actor)
    query = (select(TaskAssignment).join(TaskAssignment.task).options(contains_eager(TaskAssignment.task)).where(TaskAssignment.employee_id == profile.id))
    if filters.status:
        query = query.where(TaskAssignment.status ==filters.status)

    query=(query.order_by(Task.deadline.asc().nulls_last(),TaskAssignment.id.desc()).limit(filters.limit).offset(filters.offset))
    return list(db.scalars(query).all())




def get_task(db: Session,actor: Membership, task_id:int)-> Task:
    task = _get_task(db,actor,task_id)
    _check_can_view(actor,task)
    return task


def update_task(db: Session,actor: Membership,task_id: int,data: TaskUpdate)-> Task:
    task = _get_task(db,actor,task_id)
    changes = data.model_dump(exclude_unset=True)
    assignee_ids = changes.pop("assignee_ids",None)
    if not changes and assignee_ids is None:
        return task

    for field,value in changes.items():
        setattr(task,field,value)

    new_profiles = []
    if assignee_ids is not None:
        profiles = _get_assignees(db,actor,assignee_ids)
        already_assigned = {a.employee_id for a in task.assignments}

        task.assignments = [a for a in task.assignments if a.employee_id in assignee_ids]

        for profile in profiles:
                    if profile.id not in already_assigned:
                        task.assignments.append(TaskAssignment(business_id=actor.business_id,employee=profile))
                        new_profiles.append(profile)
        details = {"fields": list(changes)}
        if assignee_ids is not None:
            details["assignee_ids"] = assignee_ids
        audit(db,actor,"task.updated",task.id,details)

        db.commit()

        task = _get_task(db,actor,task.id)
        _notify_assignees(actor,task,new_profiles)
        return task



def delete_task(db: Session, actor: Membership, task_id: int)-> None:
    task = _get_task(db,actor,task_id)

    audit(db,actor,"task.deleted", task.id, {"title": task.title})
    db.delete(task)
    db.commit()



def update_my_status(db: Session, actor: Membership,task_id: int,data: TaskStatusUpdate)->TaskAssignment:
    profile = employee_service.get_my_profile(db,actor)

    assignment=db.scalar(select(TaskAssignment).where(TaskAssignment.task_id == task_id,TaskAssignment.employee_id == profile.id,).options(selectinload(TaskAssignment.task)))

    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Task not found")

    if assignment.status != data.status:
        assignment.status = data.status
        if data.status == TaskStatus.completed:
            assignment.completed_at = datetime.now(timezone.utc)
        else:
            assignment.completed_at = None
        db.commit()

    return assignment



def add_comment(db: Session,actor: Membership, task_id: int, data: CommentCreate)->TaskComment:
    task = _get_task(db,actor,task_id)
    _check_can_view(actor,task)

    comment = TaskComment(
        business_id=actor.business_id,
        task_id=task.id,
        author_id=actor.id,
        body=data.body,
    )
    db.add(comment)
    db.commit()
    return comment



def list_comment(db: Session,actor: Membership, task_id: int,filters: CommentFilters)->list[TaskComment]:
    task = _get_task(db,actor,task_id)
    _check_can_view(actor,task)

    query = (select(TaskComment).where(TaskComment.task_id == task.id).options(selectinload(TaskComment.author).selectinload(Membership.user)).order_by(TaskComment.created_at,TaskComment.id).limit(filters.limit).offset(filters.offset))

    return list(db.scalars(query).all())