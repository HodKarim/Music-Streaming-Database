from fastapi import APIRouter, HTTPException

from backend.database import execute_query, fetch_all, fetch_one
from backend.schemas import UserCreate


router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def get_users():
    users = fetch_all(
        """
        SELECT user_id, name, email, is_admin
        FROM users
        ORDER BY user_id
        """
    )

    if users:
        return users

    user_id = execute_query(
        """
        INSERT INTO users (name, email, password, is_admin)
        VALUES (%s, %s, %s, %s)
        """,
        ("Demo User", "demo@example.com", "demo-password", False),
    )

    return [get_user(user_id)]


@router.get("/{user_id}")
def get_user(user_id: int):
    user = fetch_one(
        """
        SELECT user_id, name, email, is_admin
        FROM users
        WHERE user_id = %s
        """,
        (user_id,),
    )

    if not user:
        raise HTTPException(404, detail="User not found")

    return user


@router.post("")
def create_user(user: UserCreate):
    user_id = execute_query(
        """
        INSERT INTO users (name, email, password, is_admin)
        VALUES (%s, %s, %s, %s)
        """,
        (user.name, user.email, user.password, user.is_admin),
    )

    return get_user(user_id)
