from typing import Annotated

from fastapi import APIRouter,Depends,Query,Response
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.enums import Role
from app.models.membership import Membership

from app.schemas.attendance import ShiftFilters
from app.schemas.pay import PaySummaryFilters
from app.security.dependencies import require_roles

from app.services import report_service

router = APIRouter(prefix="/reports",tags=["Reports"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))


def csv_response(content: str,filename: str)->Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )



@router.get("/attendance.csv")
def attendance_report(filters: Annotated[ShiftFilters,Query()],membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    content = report_service.attendance_csv(db,membership,filters)
    return csv_response(content,f"attendance_{filters.date_from}_{filters.date_to}.csv")


@router.get("/pay-summaries.csv")
def pay_summaries_report(filters: Annotated[PaySummaryFilters,Query()],membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    content = report_service.pay_summaries_csv(db,membership,filters)
    return csv_response(content, "pay-summaries.csv")