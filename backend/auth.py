import secrets

import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.database import execute_query, fetch_one


security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith("$2"):
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

    return secrets.compare_digest(password, password_hash)


def ensure_session_table():
    execute_query(
        """
        CREATE TABLE IF NOT EXISTS user_sessions (
            token VARCHAR(255) PRIMARY KEY,
            user_id INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
        """
    )


def public_user(user: dict):
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "is_admin": bool(user["is_admin"]),
    }


def create_session(user_id: int) -> str:
    ensure_session_table()
    token = secrets.token_urlsafe(32)
    execute_query(
        """
        INSERT INTO user_sessions (token, user_id)
        VALUES (%s, %s)
        """,
        (token, user_id),
    )
    return token


def delete_session(token: str):
    ensure_session_table()
    execute_query(
        """
        DELETE FROM user_sessions
        WHERE token = %s
        """,
        (token,),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if not credentials:
        raise HTTPException(401, detail="Sign in required")

    ensure_session_table()
    user = fetch_one(
        """
        SELECT u.user_id, u.name, u.email, u.password, u.is_admin
        FROM user_sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.token = %s
        """,
        (credentials.credentials,),
    )

    if not user:
        raise HTTPException(401, detail="Invalid session")

    user["is_admin"] = bool(user["is_admin"])
    user["token"] = credentials.credentials
    return user


def require_admin(current_user: dict = Depends(get_current_user)):
    if not current_user["is_admin"]:
        raise HTTPException(403, detail="Admin access required")
    return current_user


def can_manage_user_resource(current_user: dict, user_id: int) -> bool:
    return current_user["is_admin"] or current_user["user_id"] == user_id
