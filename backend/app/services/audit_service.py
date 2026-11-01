import enum

from sqlalchemy import select

from app.core.timezone import local_day_end,local_day_start
from app.schemas.audit import AuditFilters

from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.membership import Membership

def log_action(db: Session,*,business_id: int,actor_user_id: int,action: str,entity_type: str, entity_id: int | None = None,details: dict | None =None,)->None:
    db.add(AuditLog(
        business_id=business_id,
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    ))



def to_log_value(value):
    if value is None or isinstance(value,(int,list)):
        return value
    if isinstance(value,enum.Enum):
        return value.value
    return str(value)



def audit(db: Session,actor: Membership,action: str,entity_id: int | None = None,details: dict | None = None,)-> None:
    log_action(
        db,business_id=actor.business_id,actor_user_id=actor.user_id,action=action,entity_type=action.split(".")[0],entity_id=entity_id,details=details,
    )



def list_audit_logs(db: Session,actor: Membership,filters: AuditFilters)-> list[AuditLog]:
    timezone_name = actor.business.timezone
    query = select(AuditLog).where(AuditLog.business_id == actor.business_id)

    if filters.action:
        query = query.where(AuditLog.action == filters.action)

    if filters.date_from:
        query = query.where(AuditLog.created_at >= local_day_start(filters.date_from,timezone_name))

    if filters.date_to:
        query = query.where(AuditLog.created_at < local_day_end(filters.date_to,timezone_name))

    query=(query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(filters.limit).offset(filters.offset))

    return list(db.scalars(query).all())


