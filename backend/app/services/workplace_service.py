from fastapi import HTTPException,status
from sqlalchemy import select
from sqlalchemy.orm import Session


from app.models.membership import Membership
from app.models.workplace_qr import WorkplaceQR
from app.schemas.workplace import QRTokenOut,WorkplaceCreate,WorkplaceUpdate
from app.security.qr_tokens import (QR_TOKEN_SECONDS,create_qr_token,generate_workplace_secret,)
from app.services.audit_service import audit


def _get_workplace(db: Session, actor: Membership, workplace_id: int)-> WorkplaceQR:
    workplace = db.scalar(select(WorkplaceQR).where(WorkplaceQR.id == workplace_id, WorkplaceQR.business_id == actor.business_id,))

    if workplace is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Workplace not found")
    return workplace


def _name_taken(db: Session, actor: Membership, name: str, exclude_id: int | None = None)->bool:
    query = select(WorkplaceQR.id).where(WorkplaceQR.business_id == actor.business_id,WorkplaceQR.name == name,)

    if exclude_id:
        query = query.where(WorkplaceQR.id != exclude_id)
    return db.scalar(query) is not None




def create_workplace(db: Session,actor: Membership,data: WorkplaceCreate)-> WorkplaceQR:
    if _name_taken(db,actor,data.name):
        raise HTTPException(status.HTTP_409_CONFLICT,"You already have a workplace with this name")

    workplace = WorkplaceQR(
        business_id=actor.business_id,
        name=data.name,
        secret=generate_workplace_secret(),
    )

    db.add(workplace)
    db.flush()
    audit(db,actor,"workplace.created",workplace.id,{"name": workplace.name})
    db.commit()
    return workplace


def list_workplaces(db: Session,actor:Membership)->list[WorkplaceQR]:
    query=(select(WorkplaceQR).where(WorkplaceQR.business_id == actor.business_id).order_by(WorkplaceQR.name))

    return list(db.scalars(query).all())



def update_workplace(db: Session,actor: Membership,workplace_id: int,data: WorkplaceUpdate)->WorkplaceQR:
    workplace = _get_workplace(db,actor,workplace_id)
    changes = data.model_dump(exclude_unset=True)
    for field,value in changes.items():
        if value is None:
            raise HTTPException(422,f"{field} cannot be empty")
        if "name" in changes and _name_taken(db,actor,changes["name"],workplace_id):
            raise HTTPException(status.HTTP_409_CONFLICT,"You already have a workplace with this name")
        for field,value in changes.items():
            setattr(workplace,field,value)

        audit(db,actor,"workplace.updated",workplace.id,changes)
        db.commit()
        return workplace



def regenerate_workplace_secret(db: Session,actor: Membership,workplace_id: int)->WorkplaceQR:
    workplace = _get_workplace(db,actor,workplace_id)

    workplace.secret = generate_workplace_secret()
    audit(db,actor,"workplace.regenerated",workplace.id)
    db.commit()
    return workplace



def get_qr_token(db: Session,actor:Membership,workplace_id: int)->QRTokenOut:
    workplace = _get_workplace(db,actor,workplace_id)
    if not workplace.active:
        raise HTTPException(status.HTTP_409_CONFLICT,"This workplace is switched off")

    token = create_qr_token(workplace.id,workplace.secret)

    return QRTokenOut(token=token,expires_in_seconds=QR_TOKEN_SECONDS)





    
        
