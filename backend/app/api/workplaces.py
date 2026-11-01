from fastapi import APIRouter,Depends,status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership
from app.schemas.workplace import (
    QRTokenOut,WorkplaceCreate,WorkplaceOut,WorkplaceUpdate
)
from app.security.dependencies import require_roles
from app.services import workplace_service


router = APIRouter(prefix="/workplaces",tags=["Workplaces"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))

@router.post("", response_model=WorkplaceOut,status_code=status.HTTP_201_CREATED)
def create_workplace(data: WorkplaceCreate,membership: Membership=manager_or_owner,db: Session = Depends(get_db)):
    return workplace_service.create_workplace(db,membership,data)



@router.get("",response_model=list[WorkplaceOut])
def list_workplaces(membership: Membership = manager_or_owner,db: Session = Depends(get_db),):
    return workplace_service.list_workplaces(db,membership)


@router.patch("/{workplace_id}", response_model=WorkplaceOut)
def update_workplace(workplace_id: int,data: WorkplaceUpdate, membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return workplace_service.update_workplace(db,membership,workplace_id,data)



@router.post("/{workplace_id}/regenerate", response_model=WorkplaceOut)
def regenerate_workplace_secret(workplace_id: int,membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return workplace_service.regenerate_workplace_secret(db,membership,workplace_id)


@router.get("/{workplace_id}/qr",response_model=QRTokenOut)
def get_qr_token(workplace_id: int, membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    return workplace_service.get_qr_token(db,membership,workplace_id)