import os

import mysql.connector
from fastapi import HTTPException
from mysql.connector import Error


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "password"),
        database=os.getenv("DB_NAME", "music_streaming"),
        port=int(os.getenv("DB_PORT", "3306")),
    )


def fetch_all(query: str, params: tuple = ()):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        return cursor.fetchall()
    except Error as exc:
        raise HTTPException(
            500,
            detail=f"Database error: {exc}",
        ) from exc
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


def fetch_one(query: str, params: tuple = ()):
    rows = fetch_all(query, params)
    return rows[0] if rows else None


def execute_query(query: str, params: tuple = ()):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid
    except Error as exc:
        if conn:
            conn.rollback()
        raise HTTPException(
            500,
            detail=f"Database error: {exc}",
        ) from exc
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


def execute_transaction(queries: list[tuple[str, tuple]]):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        for query, params in queries:
            cursor.execute(query, params)

        conn.commit()
    except Error as exc:
        if conn:
            conn.rollback()
        raise HTTPException(
            500,
            detail=f"Database error: {exc}",
        ) from exc
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
