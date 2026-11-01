from fastapi import Depends,HTTPException,status
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db

from app.models.user import User
from app.models.membership import Membership
from app.models.enums import MembershipStatus,Role
from app.security.tokens import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)

def _unauthorized()-> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid or token expired", headers={"WWW-Authenticate": "Bearer"})

def get_current_membership(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db))-> Membership:
    if credentials is None:
        raise _unauthorized()
    
    payload = decode_access_token(credentials.credentials)

    if payload is None:
        raise _unauthorized()
    
    membership = db.get(Membership, payload.get("mid"))

    if (membership is None or str(membership.user_id) != payload.get("sub") or membership.status != MembershipStatus.active or not membership.user.is_active):
        raise _unauthorized()

    return membership



def require_roles(*allowed: Role):
    def checker(membership: Membership = Depends(get_current_membership)) -> Membership:
        if membership.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have a permission")

        return membership
    return checker