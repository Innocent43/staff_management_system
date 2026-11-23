from fastapi import APIRouter,Depends,File,HTTPException,UploadFile,status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.membership import Membership
from app.schemas.auth import UserOut
from app.security.dependencies import get_current_membership

from app.security.rate_limit import check_rate_limit
from app.services import user_service
from app.services.image_service import MAX_IMAGE_SIZE



router = APIRouter(prefix="/users",tags=["Users"])


@router.put("/me/profile-image",response_model=UserOut)
def upload_my_profile_image(file: UploadFile = File(...),membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db),):
    check_rate_limit(f"profile-image:{membership.user_id}",10,3600)

    allowed_types = {"image/jpeg","image/png","image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only JPEG, PNG and WebP images are supported.")
    image_data = file.file.read(MAX_IMAGE_SIZE + 1)

    if len(image_data) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE,detail="Image must not exceed 5 MB.")

    try:
        user = user_service.upload_profile_image(db,membership.user,image_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=str(exc),) from exc
    return user_service.user_to_response(user)




@router.delete("/me/profile-image",response_model=UserOut)
def remove_my_profile_image(membership: Membership = Depends(get_current_membership), db: Session = Depends(get_db),):
    user = user_service.remove_profile_image(db,membership.user)
    return user_service.user_to_response(user)