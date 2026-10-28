import re
from datetime import date
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..models import Beneficiary
from .ocr_service import aadhaar_hash


def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()


def normalized_address(address: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", address.lower()).strip()


def similarity(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    left_tokens = set(left.split())
    right_tokens = set(right.split())
    if left_tokens == right_tokens:
        return 1.0
    if not left_tokens or not right_tokens:
        return 0.0
    return len(left_tokens & right_tokens) / len(left_tokens | right_tokens)


def check_duplicates(db: Session, candidate: dict) -> list[dict]:
    matches = []
    query = select(Beneficiary)
    candidates = db.scalars(query).all()
    aadhaar = candidate.get("aadhaar_hash")
    if not aadhaar and candidate.get("aadhaar_identifier"):
        aadhaar = aadhaar_hash(candidate["aadhaar_identifier"])
    exclude_id = candidate.get("exclude_beneficiary_id")
    phone = candidate.get("phone")
    name = normalize_name(candidate.get("name") or "")
    dob = candidate.get("date_of_birth")
    address = normalized_address(candidate.get("address") or "")

    for existing in candidates:
        if existing.id == exclude_id:
            continue
        existing_name = normalize_name(existing.name)
        existing_address = normalized_address(existing.address or "")
        existing_phone = existing.phone or ""
        existing_aadhaar = existing.aadhaar_hash
        reasons = []
        score = 0

        if aadhaar and existing_aadhaar and aadhaar == existing_aadhaar:
            score = 100
            reasons.append("Same Aadhaar identifier detected")
        elif phone and existing_phone and phone == existing_phone and name and similarity(name, existing_name) >= 0.85:
            score = 80
            reasons.append("Same phone number and similar name detected")
        elif name and dob and address and existing_name == name and existing.date_of_birth == dob and existing_address == address:
            score = 70
            reasons.append("Same name, date of birth, and address detected")
        elif name and existing_name and similarity(name, existing_name) >= 0.9 and dob and existing.date_of_birth == dob:
            score = 65
            reasons.append("Similar name and date of birth detected")

        if reasons:
            matches.append({
                "beneficiary_id": existing.id,
                "application_id": existing.application_id,
                "name": existing.name,
                "district": existing.district,
                "status": existing.verification_status,
                "match_type": "EXACT" if score >= 80 else "POSSIBLE",
                "reason": "; ".join(reasons),
                "score": score,
                "masked_aadhaar": existing.masked_aadhaar,
            })
    return matches
