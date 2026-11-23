import logging
from uuid import uuid4

from sqlalchemy.orm import Session
from app.models.user import User

from app.services.image_service import process_profile_image
from app.services.storage_service import generate_image_url,delete_image,upload_image


logger = logging.getLogger(__name__)


def user_to_response(user: User)->dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "profile_image_url": (generate_image_url(user.profile_image_key) if user.profile_image_key else None),
    }



def upload_profile_image(db: Session,user: User, image_data: bytes)->User:
    processed_image = process_profile_image(image_data)

    new_key = f"profile-images/{user.id}/{uuid4().hex}.webp"
    old_key = user.profile_image_key
    # Upload the new image before changing the database reference.
    upload_image(new_key,processed_image)

    try:
        user.profile_image_key = new_key
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        # Remove the newly uploaded object if the database update fails.
        try:
            delete_image(new_key)
        except Exception:
            logger.exception("Failed to clean up an unreferenced profile image")

        raise

    # The database now points to the new image. Remove the old one afterward.
    if old_key:
        try:
            delete_image(old_key)
        except Exception:
            logger.exception("Failed to delete the user's previous profile image")
    return user




def remove_profile_image(db: Session,user: User)->User:
    """Remove a user's profile picture."""

    old_key = user.profile_image_key

    if old_key is None:
        return user

    user.profile_image_key = None
    db.commit()
    db.refresh(user)

    try:
        delete_image(old_key)
    except Exception:
        logger.exception("Failed to delete the user's removed profile image")

    return user






        




