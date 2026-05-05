from fastapi import APIRouter, Depends, HTTPException

from backend.auth import (
    get_current_user,
    hash_password,
    public_user,
    verify_password,
)
from backend.database import execute_query, fetch_one
from backend.schemas import UserCreate, UserLogin


router = APIRouter(prefix="/auth", tags=["auth"])


def auth_response(user: dict):
    return public_user(user)


@router.post("/signup")
def signup(user: UserCreate):
    existing_user = fetch_one(
        """
        SELECT user_id
        FROM users
        WHERE email = %s
        """,
        (user.email,),
    )

    if existing_user:
        raise HTTPException(409, detail="Email already exists")

    user_id = execute_query(
        """
        INSERT INTO users (name, email, password, is_admin)
        VALUES (%s, %s, %s, %s)
        """,
        (user.name, user.email, hash_password(user.password), user.is_admin),
    )

    created_user = fetch_one(
        """
        SELECT user_id, name, email, password, is_admin
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )
    return auth_response(created_user)


@router.post("/login")
def login(credentials: UserLogin):
    user = fetch_one(
        """
        SELECT user_id, name, email, password, is_admin
        FROM users
        WHERE email = %s
        """,
        (credentials.email,),
    )

    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(401, detail="Invalid email or password")

    return auth_response(user)


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return public_user(current_user)
