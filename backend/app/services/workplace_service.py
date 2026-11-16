
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.membership import Membership
from app.models.workplace_qr import WorkplaceQR
from app.schemas.workplace import (
    QRTokenOut,
    WorkplaceCreate,
    WorkplaceUpdate,
)
from app.security.qr_tokens import (
    QR_TOKEN_SECONDS,
    create_qr_token,
    generate_workplace_secret,
)
from app.services.audit_service import audit



def _get_workplace(
    db: Session,
    actor: Membership,
    workplace_id: int,
) -> WorkplaceQR:
    workplace = db.scalar(
        select(WorkplaceQR).where(
            WorkplaceQR.id == workplace_id,
            WorkplaceQR.business_id == actor.business_id,
        )
    )

    if workplace is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Workplace not found",
        )

    return workplace


def _name_taken(
    db: Session,
    actor: Membership,
    name: str,
    exclude_id: int | None = None,
) -> bool:
    query = select(WorkplaceQR.id).where(
        WorkplaceQR.business_id == actor.business_id,
        WorkplaceQR.name == name,
    )

    if exclude_id is not None:
        query = query.where(WorkplaceQR.id != exclude_id)

    return db.scalar(query) is not None


def _validate_coordinates(
    latitude: float | None,
    longitude: float | None,
) -> None:
    # A workplace must have both coordinates or neither.
    if (latitude is None) != (longitude is None):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Latitude and longitude must be provided together.",
        )



def _validate_location_requirement(
    latitude: float | None,
    longitude: float | None,
    require_location_verification: bool,
) -> None:
    if require_location_verification and (
        latitude is None or longitude is None
    ):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Set the workplace latitude and longitude before enabling location verification.",
        )





def create_workplace(
    db: Session,
    actor: Membership,
    data: WorkplaceCreate,
) -> WorkplaceQR:
    _validate_coordinates(data.latitude, data.longitude)

    _validate_location_requirement(
    data.latitude,
    data.longitude,
    data.require_location_verification,
)

    if _name_taken(db, actor, data.name):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "You already have a workplace with this name",
        )

    workplace = WorkplaceQR(
        business_id=actor.business_id,
        name=data.name,
        address=data.address,
        secret=generate_workplace_secret(),
        latitude=data.latitude,
        longitude=data.longitude,
        geofence_radius_m=data.geofence_radius_m,
        require_location_verification=data.require_location_verification,
    )

    db.add(workplace)
    db.flush()

    audit(
        db,
        actor,
        "workplace.created",
        workplace.id,
        {
            "name": workplace.name,
            "latitude": workplace.latitude,
            "longitude": workplace.longitude,
            "geofence_radius_m": workplace.geofence_radius_m,
            "require_location_verification": (
                workplace.require_location_verification
            ),
        },
    )

    db.commit()
    db.refresh(workplace)

    return workplace


def list_workplaces(
    db: Session,
    actor: Membership,
) -> list[WorkplaceQR]:
    query = (
        select(WorkplaceQR)
        .where(WorkplaceQR.business_id == actor.business_id)
        .order_by(WorkplaceQR.name)
    )

    return list(db.scalars(query).all())


def update_workplace(
    db: Session,
    actor: Membership,
    workplace_id: int,
    data: WorkplaceUpdate,
) -> WorkplaceQR:
    workplace = _get_workplace(db, actor, workplace_id)

    # Only fields explicitly supplied by the client are included.
    changes = data.model_dump(exclude_unset=True)

    if not changes:
        return workplace

    # These fields cannot be cleared with null.
    required_fields = {
        "name",
        "active",
        "geofence_radius_m",
        "require_location_verification",
    }

    for field in required_fields:
        if field in changes and changes[field] is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"{field} cannot be empty",
            )

    # Check the name only when the client is changing it.
    if "name" in changes:
        if _name_taken(
            db,
            actor,
            changes["name"],
            exclude_id=workplace.id,
        ):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "You already have a workplace with this name",
            )

    # Calculate the resulting coordinates after applying the changes.
    # This also allows the owner to clear both coordinates together.
    new_latitude = changes.get("latitude", workplace.latitude)
    new_longitude = changes.get("longitude", workplace.longitude)

    new_require_location = changes.get(
    "require_location_verification",
    workplace.require_location_verification,
)

    _validate_coordinates(new_latitude, new_longitude)
    
    coordinates_changed = (
        new_latitude != workplace.latitude
        or new_longitude != workplace.longitude
    )

    if coordinates_changed and "address" not in changes:
        changes["address"] = None

    _validate_location_requirement(
    new_latitude,
    new_longitude,
    new_require_location,
)

    # Apply each change exactly once.
    for field, value in changes.items():
        setattr(workplace, field, value)

    audit(
        db,
        actor,
        "workplace.updated",
        workplace.id,
        changes,
    )

    db.commit()
    db.refresh(workplace)

    return workplace


def regenerate_workplace_secret(
    db: Session,
    actor: Membership,
    workplace_id: int,
) -> WorkplaceQR:
    workplace = _get_workplace(db, actor, workplace_id)

    workplace.secret = generate_workplace_secret()

    audit(
        db,
        actor,
        "workplace.regenerated",
        workplace.id,
    )

    db.commit()
    db.refresh(workplace)

    return workplace


def get_qr_token(
    db: Session,
    actor: Membership,
    workplace_id: int,
) -> QRTokenOut:
    workplace = _get_workplace(db, actor, workplace_id)

    if not workplace.active:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This workplace is switched off",
        )

    token = create_qr_token(
        workplace.id,
        workplace.secret,
    )

    return QRTokenOut(
        token=token,
        expires_in_seconds=QR_TOKEN_SECONDS,
    )
