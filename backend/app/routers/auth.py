from datetime import timedelta

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, EmailStr

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.database import db
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response):
    existing = await db.user.find_unique(where={"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await db.user.create(
        data={
            "name": body.name,
            "email": body.email,
            "password": hash_password(body.password),
        }
    )

    token = create_access_token({"sub": user.id})
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="none" if is_prod else "lax",
        secure=is_prod,
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
    )
    return {"id": user.id, "name": user.name, "email": user.email}


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    user = await db.user.find_unique(where={"email": body.email})
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.id})
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="none" if is_prod else "lax",
        secure=is_prod,
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
    )
    return {"id": user.id, "name": user.name, "email": user.email}


@router.post("/logout")
async def logout(response: Response):
    is_prod = settings.ENVIRONMENT == "production"
    response.delete_cookie(
        "access_token",
        httponly=True,
        samesite="none" if is_prod else "lax",
        secure=is_prod,
    )
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "createdAt": current_user.createdAt,
    }
