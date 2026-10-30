from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import AuditLog, Beneficiary, VerificationRecord

VERIFICATION_SCORES = {
    "identity_complete": 35,
    "duplicate_clear": 35,
    "disaster_information_complete": 30,
}


def calculate_score(details: dict) -> int:
    score = 0
    if details.get("identity_complete"):
        score += VERIFICATION_SCORES["identity_complete"]
    if details.get("duplicate_clear"):
        score += VERIFICATION_SCORES["duplicate_clear"]
    if details.get("disaster_information_complete"):
        score += VERIFICATION_SCORES["disaster_information_complete"]
    if details.get("document_available"):
        score += 10
    if details.get("ocr_successful"):
        score += 10
    return min(score, 100)


def create_audit(db: Session, user_id: int | None, action: str, entity_type: str, entity_id: str, remarks: str | None = None, beneficiary_id: int | None = None) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        beneficiary_id=beneficiary_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        remarks=remarks,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    return log


def change_status(db: Session, beneficiary: Beneficiary, officer_id: int, new_status: str, score: int, remarks: str) -> VerificationRecord:
    previous_status = beneficiary.verification_status
    record = VerificationRecord(
        beneficiary_id=beneficiary.id,
        officer_id=officer_id,
        previous_status=previous_status,
        new_status=new_status,
        score=score,
        remarks=remarks,
        created_at=datetime.now(timezone.utc),
    )
    beneficiary.verification_status = new_status
    beneficiary.verification_score = score
    beneficiary.updated_at = datetime.now(timezone.utc)
    db.add(record)
    return record
