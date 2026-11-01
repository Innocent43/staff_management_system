from typing import Annotated

from fastapi import APIRouter,Depends,Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership
from app.schemas.audit import AuditFilters,AuditLogOut
from app.security.dependencies import require_roles
from app.services import audit_service



router = APIRouter(prefix="/audit-logs", tags=["Audit logs"])

@router.get("",response_model=list[AuditLogOut])
def list_audit_logs(filters: Annotated[AuditFilters,Query()], membership: Membership = Depends(require_roles(Role.owner)), db: Session = Depends(get_db)):
    return audit_service.list_audit_logs(db,membership,filters)