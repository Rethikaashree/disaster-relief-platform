from getpass import getpass

from sqlalchemy import select

from .database import SessionLocal, ensure_database_schema
from .models import AuditLog, User
from .schemas import normalize_email
from .security import hash_password


def main() -> None:
    ensure_database_schema()
    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.role == "MAIN_ADMIN")):
            raise SystemExit("A Main Admin already exists; bootstrap will not create another.")

        name = input("Main Admin full name: ").strip()
        if len(name) < 2:
            raise SystemExit("Name must contain at least two characters.")
        try:
            email = normalize_email(input("Main Admin email: "))
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
        if db.scalar(select(User.id).where(User.email == email)):
            raise SystemExit("That email already belongs to an account.")

        password = getpass("Main Admin password (12+ characters): ")
        confirmation = getpass("Confirm password: ")
        if len(password) < 12:
            raise SystemExit("Password must contain at least 12 characters.")
        if password != confirmation:
            raise SystemExit("Passwords do not match.")

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="MAIN_ADMIN",
            status="ACTIVE",
        )
        db.add(admin)
        db.flush()
        db.add(AuditLog(
            user_id=admin.id,
            action="MAIN_ADMIN_BOOTSTRAPPED",
            entity_type="USER",
            entity_id=str(admin.id),
            remarks="Initial Main Admin created through interactive bootstrap.",
        ))
        db.commit()
        print(f"Initial Main Admin account created for {email}.")


if __name__ == "__main__":
    main()