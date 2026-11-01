from typing import Annotated

from fastapi import APIRouter,Depends,Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership
from app.schemas.pay import (
    PayAdjustment,PayGenerateOut,PayGenerateRequest,PaySummaryListFilters,PaySummaryOut,
)

from app.security.dependencies import require_roles
from app.security.rate_limit import check_rate_limit
from app.services import pay_service

router = APIRouter(prefix="/pay-summaries", tags=["Pay summaries"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))


@router.post("/generate", response_model=PayGenerateOut)
def generate_summaries(data: PayGenerateRequest,membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    check_rate_limit(f"pay-generate:{membership.id}",10,60)
    return pay_service.generate_summaries(db,membership,data)


@router.get("",response_model=list[PaySummaryOut])
def list_summaries(filters: Annotated[PaySummaryListFilters,Query()],membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return pay_service.list_summaries(db,membership,filters)



@router.get("/{summary_id}",response_model=PaySummaryOut)
def get_summary(summary_id: int,membership: Membership = manager_or_owner,db: Session = Depends(get_db),):
    return pay_service.get_summary(db,membership,summary_id)



@router.patch("/{summary_id}/adjust",response_model=PaySummaryOut)
def adjust_summary(summary_id: int,data: PayAdjustment,membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return pay_service.adjust_summary(db,membership,summary_id,data)



@router.post("/{summary_id}/approve",response_model=PaySummaryOut)
def approve_summary(summary_id: int,membership: Membership = manager_or_owner,db: Session = Depends(get_db),):
    return pay_service.approve_summary(db,membership,summary_id)

