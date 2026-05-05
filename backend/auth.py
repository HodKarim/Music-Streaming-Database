import secrets

import bcrypt
from fastapi import Depends, Header, HTTPException

from backend.database import fetch_one


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith("$2"):
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

    return secrets.compare_digest(password, password_hash)


def public_user(user: dict):
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "is_admin": bool(user["is_admin"]),
    }


def get_current_user(
    current_user_id: int | None = Header(default=None, alias="X-User-Id"),
):
    if not current_user_id:
        raise HTTPException(401, detail="User id required")

    user = fetch_one(
        """
        SELECT user_id, name, email, password, is_admin
        FROM users
        WHERE user_id = %s
        """,
        (current_user_id,),
    )

    if not user:
        raise HTTPException(401, detail="Invalid user")

    user["is_admin"] = bool(user["is_admin"])
    return user


def require_admin(current_user: dict = Depends(get_current_user)):
    if not current_user["is_admin"]:
        raise HTTPException(403, detail="Admin access required")
    return current_user


def can_manage_user_resource(current_user: dict, user_id: int) -> bool:
    return current_user["is_admin"] or current_user["user_id"] == user_id
