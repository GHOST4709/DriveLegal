"""
auth.py  ── Drop this file next to your existing main.py
─────────────────────────────────────────────────────────
Three endpoints:
  POST /api/auth/register  → create account, return JWT
  POST /api/auth/login     → verify credentials, return JWT
  GET  /api/auth/me        → return current user (bearer token)

Then in main.py add TWO lines (see main.py instructions below):
  from auth import router as auth_router
  app.include_router(auth_router)
"""

import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import User

# ─── Config ───────────────────────────────────────────────────
SECRET_KEY  = os.getenv("SECRET_KEY", "road-safety-ai-dev-secret-change-in-prod")
ALGORITHM   = "HS256"
TOKEN_HOURS = 24                    # token lifetime in hours

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()
router        = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ─── Pydantic schemas ─────────────────────────────────────────
class RegisterIn(BaseModel):
    full_name: str = Field(..., min_length=2,  max_length=200)
    email:     str = Field(..., min_length=5)
    password:  str = Field(..., min_length=6,  description="Minimum 6 characters")

class LoginIn(BaseModel):
    email:    str
    password: str

class UserOut(BaseModel):
    id:         int
    full_name:  str
    email:      str
    created_at: datetime
    model_config = {"from_attributes": True}

class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut


# ─── Internal helpers ──────────────────────────────────────────
def _hash(password: str) -> str:
    return pwd_context.hash(password)

def _verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def _make_token(user_id: int, email: str) -> str:
    expires = datetime.utcnow() + timedelta(hours=TOKEN_HOURS)
    return jwt.encode(
        {"sub": email, "user_id": user_id, "exp": expires},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

# ─── Reusable dependency — use in any protected route ─────────
def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db:    Session                       = Depends(get_db),
) -> User:
    """
    Validates the Bearer token and returns the matching User ORM object.
    Use as:  current_user: User = Depends(get_current_user)
    """
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or has expired")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
    return user


# ─── Routes ───────────────────────────────────────────────────
@router.post(
    "/register",
    response_model=TokenOut,
    status_code=201,
    summary="Create a new user account and receive a JWT",
)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name       = data.full_name.strip(),
        email           = email,
        hashed_password = _hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenOut(
        access_token = _make_token(user.id, user.email),
        user         = UserOut.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenOut,
    summary="Log in with email + password and receive a JWT",
)
def login(data: LoginIn, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user  = db.query(User).filter(User.email == email).first()

    if not user or not _verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    return TokenOut(
        access_token = _make_token(user.id, user.email),
        user         = UserOut.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserOut,
    summary="Return the authenticated user's profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
