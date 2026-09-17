import os
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


# ==================================================
# CONFIGURATION
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent

PROFILE_IMAGE_DIR = (
    BASE_DIR
    / "uploads"
    / "profile_images"
)

PROFILE_IMAGE_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


# ==================================================
# UPLOAD PROFILE IMAGE
# ==================================================

@router.post(
    "/image",
)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Upload or replace the authenticated user's
    profile picture.

    Supported formats:

    - JPEG
    - PNG
    - WebP

    Maximum file size:

    - 5 MB
    """

    # --------------------------------------------------
    # Validate content type
    # --------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid image format. "
                "Please upload a JPG, PNG, or WebP image."
            ),
        )


    # --------------------------------------------------
    # Read uploaded file
    # --------------------------------------------------

    file_content = await file.read()


    # --------------------------------------------------
    # Validate file size
    # --------------------------------------------------

    if len(file_content) > MAX_PROFILE_IMAGE_SIZE:

        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "Profile image is too large. "
                "Maximum allowed size is 5 MB."
            ),
        )


    if not file_content:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image is empty.",
        )


    # --------------------------------------------------
    # Generate unique filename
    # --------------------------------------------------

    extension = ALLOWED_CONTENT_TYPES[
        file.content_type
    ]

    filename = (
        f"user_{current_user.id}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )


    file_path = (
        PROFILE_IMAGE_DIR
        / filename
    )


    # --------------------------------------------------
    # Remove previous profile image
    # --------------------------------------------------

    old_profile_image = (
        current_user.profile_image
    )

    if old_profile_image:

        old_filename = (
            Path(
                old_profile_image
            ).name
        )

        old_file_path = (
            PROFILE_IMAGE_DIR
            / old_filename
        )

        try:

            if old_file_path.exists():

                old_file_path.unlink()

        except OSError as error:

            print(
                "Unable to remove previous "
                f"profile image: {error}"
            )


    # --------------------------------------------------
    # Save new image
    # --------------------------------------------------

    try:

        file_path.write_bytes(
            file_content
        )

    except OSError as error:

        print(
            "Profile image save error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to save the profile image."
            ),
        )


    # --------------------------------------------------
    # Store relative path in database
    # --------------------------------------------------

    relative_path = (
        f"/uploads/profile_images/{filename}"
    )

    current_user.profile_image = (
        relative_path
    )


    # --------------------------------------------------
    # Commit database update
    # --------------------------------------------------

    try:

        db.commit()
        db.refresh(current_user)

    except Exception as error:

        db.rollback()

        # Remove newly saved file if the
        # database update fails.

        try:

            if file_path.exists():

                file_path.unlink()

        except OSError:

            pass

        print(
            "Profile image database update error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to update your profile image."
            ),
        )


    # --------------------------------------------------
    # Return updated profile image information
    # --------------------------------------------------

    return {
        "message": (
            "Profile image uploaded successfully."
        ),
        "profile_image": current_user.profile_image,
        "filename": filename,
        "content_type": file.content_type,
        "size": len(file_content),
    }