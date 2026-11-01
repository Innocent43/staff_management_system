from fastapi import APIRouter,Depends,status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest,RegisterRequest,TokenResponse,MeResponse,AcceptInvitedRequest,InviteInfoResponse

from app.security.tokens import create_access_token
from app.services import auth_service
from app.security.dependencies import get_current_membership
from app.security.rate_limit import check_rate_limit,rate_limit_by_ip

from app.services import auth_service,invite_service


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit_by_ip("register",10,3600))])
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    membership= auth_service.register_business(db,data)
    token = create_access_token(membership.user_id, membership.id)
    return {"access_token": token}


@router.post("/login",response_model=TokenResponse, dependencies=[Depends(rate_limit_by_ip("login",20, 60))])
def login(data: LoginRequest, db: Session=Depends(get_db)):
    check_rate_limit(f"Login-email:{data.email.lower()}",5,300)
    token = auth_service.login(db,data)
    return {"access_token": token}


@router.get("/me", response_model=MeResponse)
def get_me(membership=Depends(get_current_membership)):
    return {
        "user": membership.user,
        "business": membership.business,
        "role": membership.role
    }


@router.post("/accept-invite", response_model=TokenResponse, dependencies=[Depends(rate_limit_by_ip("accept-invite", 20,60))])
def accept_invite(data: AcceptInvitedRequest,db: Session=Depends(get_db)):
    token = invite_service.accept_invite(db,data)
    return {"access_token": token}



@router.get("/invite-info",response_model=InviteInfoResponse, dependencies=[Depends(rate_limit_by_ip("invite-info",30,60))],)
def invite_info(token: str,db: Session=Depends(get_db)):
    membership = invite_service.get_invite_info(db,token)
    return {
        "business_name": membership.business.name,
        "full_name": membership.user.full_name,
        "email": membership.user.email,
        "role": membership.role,
        "needs_password": membership.user.password_hash is None,
    }





