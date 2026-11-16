from fastapi import APIRouter,Depends,status,HTTPException,Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership
from app.schemas.workplace import (
    QRTokenOut,WorkplaceCreate,WorkplaceOut,WorkplaceUpdate
)
from app.security.dependencies import require_roles
from app.services import workplace_service


import logging

import httpx
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.schemas.workplace import AddressSearchOut
from app.security.rate_limit import check_rate_limit


router = APIRouter(prefix="/workplaces",tags=["Workplaces"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))





logger = logging.getLogger(__name__)


@router.get("/address-search", response_model=AddressSearchOut)
async def search_workplace_addresses(
    q: str = Query(min_length=3, max_length=120),
    membership: Membership = manager_or_owner,
):
    query = q.strip()

    if len(query) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter at least 3 characters to search.",
        )

    if not settings.geoapify_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Address search is temporarily unavailable.",
        )

    # Limit searches per business membership: 20 requests per minute.
    await run_in_threadpool(
        check_rate_limit,
        f"workplace-address-search:{membership.id}",
        20,
        60,
    )

    params = {
        "text": query,
        "limit": 5,
        "apiKey": settings.geoapify_api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0)) as client:
            response = await client.get(
                "https://api.geoapify.com/v1/geocode/autocomplete",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Address search timed out. Please try again.",
        )

    except httpx.HTTPStatusError as exc:
        logger.error(
            "Geoapify returned HTTP status %s",
            exc.response.status_code,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            if exc.response.status_code == 429
            else status.HTTP_502_BAD_GATEWAY,
            detail="Address search is temporarily unavailable.",
        )

    except (httpx.RequestError, ValueError):
        logger.exception("Address search provider request failed")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Address search is temporarily unavailable.",
        )

    suggestions = []

    for feature in data.get("features", []):
        properties = feature.get("properties", {})

        if not isinstance(properties, dict):
            continue

        formatted = properties.get("formatted")
        latitude = properties.get("lat")
        longitude = properties.get("lon")

        if (
            not isinstance(formatted, str)
            or not formatted.strip()
            or isinstance(latitude, bool)
            or not isinstance(latitude, (int, float))
            or isinstance(longitude, bool)
            or not isinstance(longitude, (int, float))
        ):
            continue

        suggestions.append({
            "id": str(properties.get("place_id") or formatted),
            "formatted": formatted,
            "address_line1": properties.get("address_line1"),
            "address_line2": properties.get("address_line2"),
            "latitude": latitude,
            "longitude": longitude,
        })

    return {"suggestions": suggestions}




    



@router.post("", response_model=WorkplaceOut,status_code=status.HTTP_201_CREATED)
def create_workplace(data: WorkplaceCreate,membership: Membership=manager_or_owner,db: Session = Depends(get_db)):
    return workplace_service.create_workplace(db,membership,data)



@router.get("",response_model=list[WorkplaceOut])
def list_workplaces(membership: Membership = manager_or_owner,db: Session = Depends(get_db),):
    return workplace_service.list_workplaces(db,membership)


@router.patch("/{workplace_id}", response_model=WorkplaceOut)
def update_workplace(workplace_id: int,data: WorkplaceUpdate, membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return workplace_service.update_workplace(db,membership,workplace_id,data)



@router.post("/{workplace_id}/regenerate", response_model=WorkplaceOut)
def regenerate_workplace_secret(workplace_id: int,membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return workplace_service.regenerate_workplace_secret(db,membership,workplace_id)


@router.get("/{workplace_id}/qr",response_model=QRTokenOut)
def get_qr_token(workplace_id: int, membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    return workplace_service.get_qr_token(db,membership,workplace_id)