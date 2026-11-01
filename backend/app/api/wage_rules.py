from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership

from app.schemas.wage_rule import WageRuleOut,WageRuleUpdate
from app.security.dependencies import require_roles
from app.services import wage_rule_service


router=APIRouter(prefix="/wage-rules",tags=["Wage rules"])

@router.get("",response_model=WageRuleOut)
def get_wage_rule(membership: Membership = Depends(require_roles(Role.owner,Role.manager)),db: Session = Depends(get_db)):
    return wage_rule_service.get_wage_rule(db,membership)


@router.put("",response_model=WageRuleOut)
def update_wage_rule(data: WageRuleUpdate,membership: Membership = Depends(require_roles(Role.owner)), db: Session = Depends(get_db),):
    return wage_rule_service.update_wage_rule(db,membership,data)

