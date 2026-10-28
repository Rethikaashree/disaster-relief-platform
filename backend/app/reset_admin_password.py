from getpass import getpass

from sqlalchemy import select

from .database import SessionLocal
from .models import AuditLog, User
from .schemas import normalize_email
from .security import hash_password


def main() -> None:
    try:
        email = normalize_email(input("Main Admin email: "))
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    password = getpass("New Main Admin password (12+ characters): ")
    confirmation = getpass("Confirm new password: ")
    if len(password) < 12:
        raise SystemExit("Password must contain at least 12 characters.")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == email, User.role == "MAIN_ADMIN"))
        if not admin:
            raise SystemExit("No Main Admin account exists for that email.")
        admin.password_hash = hash_password(password)
        admin.token_version += 1
        db.add(AuditLog(
            user_id=admin.id,
            action="MAIN_ADMIN_PASSWORD_RESET",
            entity_type="USER",
            entity_id=str(admin.id),
            remarks="Main Admin password reset through local interactive utility.",
        ))
        db.commit()

    print("Main Admin password updated. Existing sessions have been revoked.")


if __name__ == "__main__":
    main()
