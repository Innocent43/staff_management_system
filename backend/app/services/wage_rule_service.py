from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.membership import Membership
from app.models.wage_rule import WageRule
from app.schemas.wage_rule import WageRuleUpdate
from app.services.audit_service import audit,to_log_value


def get_wage_rule(db: Session,actor: Membership)->WageRule:
    query = select(WageRule).where(WageRule.business_id == actor.business_id)
    rule = db.scalar(query)
    if rule is not None:
        return rule

    db.add(WageRule(business_id=actor.business_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return db.scalar(query)


def update_wage_rule(db: Session,actor: Membership,data: WageRuleUpdate)->WageRule:
    rule = get_wage_rule(db,actor)

    changes = {}
    for field,new_value in data.model_dump().items():
        old_value = getattr(rule,field)
        if old_value != new_value:
            changes[field] = {"old": to_log_value(old_value),"new": to_log_value(new_value)}
            setattr(rule,field,new_value)

    if changes:
        audit(db,actor,"wage_rule.updated",rule.id,{"changes": changes})
        db.commit()
    return rule