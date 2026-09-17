import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User


load_dotenv()


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY is not set in the .env file"
    )


JWT_ALGORITHM = "HS256"

JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ==================================================
# REQUEST MODELS
# ==================================================

class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128,
    )


class UpdateProfileRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr


# ==================================================
# JWT
# ==================================================

def create_access_token(
    user_id: int,
) -> str:
    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    return token


# ==================================================
# REGISTER
# ==================================================

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    normalized_email = request.email.lower().strip()

    existing_user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    password_hash = bcrypt.hashpw(
        request.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    user = User(
        name=request.name.strip(),
        email=normalized_email,
        password_hash=password_hash,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_image": user.profile_image,
        },
    }


# ==================================================
# LOGIN
# ==================================================

@router.post(
    "/login",
)
def login_user(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    normalized_email = request.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    password_is_valid = bcrypt.checkpw(
        request.password.encode("utf-8"),
        user.password_hash.encode("utf-8"),
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    access_token = create_access_token(
        user.id
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_image": user.profile_image,
        },
    }


# ==================================================
# GET CURRENT USER
# ==================================================

@router.get(
    "/me",
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "profile_image": current_user.profile_image,
            "is_active": current_user.is_active,
            "created_at": (
                current_user.created_at.isoformat()
                if current_user.created_at
                else None
            ),
        }
    }


# ==================================================
# UPDATE CURRENT USER
# ==================================================

@router.patch(
    "/me",
)
def update_my_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized_name = request.name.strip()
    normalized_email = request.email.lower().strip()


    # --------------------------------------------------
    # Validate name after trimming
    # --------------------------------------------------

    if len(normalized_name) < 2:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must contain at least 2 characters.",
        )


    # --------------------------------------------------
    # Check whether email belongs to another account
    # --------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )


    # --------------------------------------------------
    # Update profile
    # --------------------------------------------------

    current_user.name = normalized_name
    current_user.email = normalized_email


    # --------------------------------------------------
    # Save changes
    # --------------------------------------------------

    try:

        db.commit()
        db.refresh(current_user)

    except Exception as error:

        db.rollback()

        print(
            "Profile update database error:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update your profile.",
        )


    # --------------------------------------------------
    # Return updated profile
    # --------------------------------------------------

    return {
        "message": "Profile updated successfully.",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "profile_image": current_user.profile_image,
            "is_active": current_user.is_active,
            "created_at": (
                current_user.created_at.isoformat()
                if current_user.created_at
                else None
            ),
        },
    }