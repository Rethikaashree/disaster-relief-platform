import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=64)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        if password_hash.startswith("scrypt$"):
            _, salt_hex, digest_hex = password_hash.split("$", 2)
            digest = hashlib.scrypt(password.encode("utf-8"), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1, dklen=64)
            return secrets.compare_digest(digest.hex(), digest_hex)
        legacy_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), settings.secret_key.encode("utf-8"), 200_000).hex()
        return secrets.compare_digest(legacy_hash, password_hash)
    except (ValueError, TypeError):
        return False


ROLE_ALIASES = {
    "admin": "MAIN_ADMIN",
    "MAIN_ADMIN": "MAIN_ADMIN",
    "verification_officer": "VERIFICATION_OFFICER",
    "VERIFICATION_OFFICER": "VERIFICATION_OFFICER",
    "beneficiary": "BENEFICIARY",
    "BENEFICIARY": "BENEFICIARY",
    "donor": "DONOR",
    "DONOR": "DONOR",
}


def normalize_role(role: str | None) -> str:
    if not role:
        return ""
    return ROLE_ALIASES.get(str(role).strip(), str(role).strip().upper())


def create_access_token(user: User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user.id), "role": normalize_role(user.role), "ver": user.token_version, "exp": expires}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def get_current_user(request: Request, db: Session = Depends(get_db), token: str | None = Depends(oauth2_scheme)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id = int(payload["sub"])
        token_version = int(payload.get("ver", 0))
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    if token_version != user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session has been revoked")
    if user.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive")
    if user.must_change_password and request.url.path not in {"/api/auth/me", "/api/auth/change-password", "/api/auth/logout"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Change your temporary password before using the portal")
    return user


def require_role(*roles: str):
    allowed = {normalize_role(role) for role in roles}

    def dependency(user: User = Depends(get_current_user)):
        if normalize_role(user.role) not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to perform this action")
        return user

    return dependency
