from fastapi import APIRouter,Depends,status,Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.employee_profile import EmployeeProfile
from app.models.enums import MembershipStatus,Role
from app.models.membership import Membership
from app.schemas.employee import (
    EmployeeOut,EmployeeUpdate,InviteRequest,inviteResponse
)
from app.security.dependencies import require_roles
from app.security.rate_limit import check_rate_limit
from app.services import invite_service,employee_service

router = APIRouter(prefix="/employees", tags=["Employees"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))

def employee_to_dict(profile: EmployeeProfile)->dict:
    return {
        "id": profile.id,
        "staff_code": profile.staff_code,
        "wage_type": profile.wage_type,
        "wage_rate": profile.wage_rate,
        "start_date": profile.start_date,
        "schedule_id": profile.schedule_id,
        "role": profile.membership.role,
        "status": profile.membership.status,
        "user": profile.membership.user,
    }


@router.post("/invite", response_model=inviteResponse,status_code=status.HTTP_201_CREATED)
def invite_employee(data: InviteRequest, membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    check_rate_limit(f"invite:{membership.id}", 30,3600)
    invited = invite_service.invite_employee(db,membership,data)

    return {
        "membership_id": invited.id,
        "email": invited.user.email,
        "role": invited.role,
        "status": invited.status,
        "invite_expires_at": invited.invite_expires_at
    }


@router.get("",response_model=list[EmployeeOut])
def list_employees(status_filter: MembershipStatus | None = Query(default=None,alias="status"),search: str | None = Query(default=None,max_length=100),limit: int = Query(default=50,ge=1,le=100), offset: int =Query(default=0,ge=0),membership: Membership= manager_or_owner,db: Session=Depends(get_db)):
    profiles = employee_service.list_employees(db,membership.business_id,status_filter,search,limit,offset)
    return [employee_to_dict(profile) for profile in profiles]


@router.get("/{employee_id}",response_model=EmployeeOut)
def get_employee(employee_id: int,membership: Membership = manager_or_owner,db: Session = Depends(get_db),):
    profile=employee_service.get_employee(db,membership.business_id,employee_id)
    return employee_to_dict(profile)


@router.patch("/{employee_id}",response_model=EmployeeOut)
def update_employee(employee_id: int,data: EmployeeUpdate,membership=manager_or_owner,db: Session=Depends(get_db)):
    profile=employee_service.update_employee(db,membership,employee_id,data)

    return employee_to_dict(profile)

@router.post("/{employee_id}/deactivate", response_model=EmployeeOut)
def deactivate_employee(employee_id: int,membership: Membership=manager_or_owner,db: Session = Depends(get_db)):
    profile=employee_service.deactivate_employee(db,membership,employee_id)
    return employee_to_dict(profile)



@router.post("/{employee_id}/reactivate", response_model=EmployeeOut)
def reactivate_employee(employee_id: int,membership: Membership=manager_or_owner,db: Session=Depends(get_db),):
    profile = employee_service.reactivate_employee(db,membership,employee_id)

    return employee_to_dict(profile)

