from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from .config import settings
from .models import Base

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    future=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def ensure_database_schema() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        users_exists = conn.execute(
            text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'")
        ).fetchone()

        if not users_exists:
            return

        user_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()
        }
        user_additions = {
            "phone": "TEXT",
            "address": "TEXT",
            "district": "TEXT",
            "state": "TEXT",
            "pincode": "TEXT",
            "status": "TEXT DEFAULT 'ACTIVE'",
            "token_version": "INTEGER DEFAULT 0",
            "must_change_password": "BOOLEAN DEFAULT 0",
            "updated_at": "DATETIME",
            "last_login_at": "DATETIME",
        }
        for column_name, definition in user_additions.items():
            if column_name not in user_columns:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {definition}"))

        beneficiary_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(beneficiaries)")).fetchall()
        }
        beneficiary_additions = {
            "number_of_dependents": "INTEGER",
            "priority_level": "TEXT DEFAULT 'NORMAL'",
            "allocation_status": "TEXT DEFAULT 'UNALLOCATED'",
            "delivery_status": "TEXT DEFAULT 'PENDING'",
        }
        for column_name, definition in beneficiary_additions.items():
            if column_name not in beneficiary_columns:
                conn.execute(text(f"ALTER TABLE beneficiaries ADD COLUMN {column_name} {definition}"))


ensure_database_schema()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
