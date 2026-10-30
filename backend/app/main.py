import math
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session
from .config import settings
from .database import SessionLocal, engine, ensure_database_schema, get_db
from .models import (
    AuditLog,
    Base,
    Beneficiary,
    BeneficiaryDuplicate,
    DistributionCentre,
    Document,
    DonationPledge,
    Notification,
    ReliefRequestItem,
    SupplyAllocation,
    SupplyInventory,
    User,
    VerificationRecord,
    ReliefDistribution,
    ReliefDistributionItem,
    DistributionConfirmation,
    BeneficiarySupplyRequest,
    BeneficiarySupplyRequestItem,
)
from .schemas import (
    AllocationRecommendationResponse,
    AuditResponse,
    BeneficiaryCreate,
    BeneficiaryRegisterRequest,
    BeneficiaryResponse,
    BeneficiaryUpdate,
    CentreRecommendation,
    ChangePasswordRequest,
    DistributionCentreResponse,
    DonationPledgeCreate,
    DonorRegisterRequest,
    DuplicateCheckRequest,
    LoginRequest,
    OfficerCreateRequest,
    OfficerPasswordResetRequest,
    ReliefRequestItemCreate,
    ReliefRequestItemResponse,
    SupplyAllocationCreate,
    SupplyAllocationResponse,
    SupplyInventoryResponse,
    UserResponse,
    VerificationRequest,
    DistributionHandoverRequest,
    DistributionConfirmRequest,
    ReliefDistributionResponse,
    ReliefDistributionItemResponse,
    DistributionTrackingSummaryResponse,
    SupplyInventoryCreate,
    SupplyInventoryUpdate,
    SupplyInventoryRestockRequest,
    SupplyRequestCreate,
    SupplyRequestReviewDecision,
    BeneficiarySupplyRequestResponse,
    BeneficiarySupplyRequestItemResponse,
)
from .security import create_access_token, get_current_user, hash_password, normalize_role, require_role, verify_password
from .services.duplicate_service import check_duplicates
from .services.ocr_service import aadhaar_hash, mask_aadhaar, process_document, validate_document
from .services.verification_service import calculate_score, change_status, create_audit

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)


def _audit(db: Session, user: User, action: str, entity_type: str, entity_id: str, remarks: str | None = None, beneficiary_id: int | None = None):
    create_audit(db, user.id, action, entity_type, entity_id, remarks, beneficiary_id)


def _notify(db: Session, user_id: int, title: str, message: str) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message))


DISTRICT_COORDS = {
    "Chennai": (13.0827, 80.2707),
    "Cuddalore": (11.7480, 79.7714),
    "Villupuram": (11.9401, 79.4861),
    "Nagapattinam": (10.7672, 79.8449),
    "Thanjavur": (10.7870, 79.1378),
    "Tiruvallur": (13.1432, 79.9074),
    "Chengalpattu": (12.6841, 79.9836),
    "Tirunelveli": (8.7139, 77.7567),
    "Thoothukudi": (8.7642, 78.1348),
    "Mayiladuthurai": (11.1018, 79.6522),
    "Kancheepuram": (12.8342, 79.7036),
    "Madurai": (9.9252, 78.1198),
    "Salem": (11.6643, 78.1460),
    "Coimbatore": (11.0168, 76.9558),
    "Trichy": (10.7905, 78.7047),
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 1)


def _beneficiary_response(beneficiary: Beneficiary) -> BeneficiaryResponse:
    response = BeneficiaryResponse.model_validate(beneficiary)
    documents = beneficiary.documents
    if any(document.ocr_status == "COMPLETED" for document in documents):
        response.document_status = "COMPLETED"
    elif documents:
        response.document_status = "UPLOADED"
    response.request_items = [ReliefRequestItemResponse.model_validate(item) for item in beneficiary.request_items]
    return response


def _authorize_beneficiary_access(user: User, beneficiary: Beneficiary) -> None:
    role = normalize_role(user.role)
    if role in {"MAIN_ADMIN", "VERIFICATION_OFFICER"}:
        return
    if role == "BENEFICIARY" and beneficiary.created_by_id == user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to access this beneficiary")


def _ensure_application_submitted(beneficiary: Beneficiary) -> None:
    if beneficiary.verification_status == "DRAFT":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A draft application cannot be reviewed")


def _user_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def ensure_main_admin() -> None:
    if not settings.main_admin_email or not settings.main_admin_password:
        return
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.role == "MAIN_ADMIN"))
        if existing:
            return
        user = User(
            name="Main Admin Officer",
            email=settings.main_admin_email.strip().lower(),
            password_hash=hash_password(settings.main_admin_password),
            role="MAIN_ADMIN",
            status="ACTIVE",
            phone="+0000000000",
        )
        db.add(user)
        db.commit()
    finally:
        db.close()


def ensure_demo_accounts(db: Session | None = None) -> None:
    if settings.environment.lower() == "production":
        return

    demo_accounts = [
        {
            "email": "beneficiary@example.com",
            "name": "Demo Beneficiary",
            "password": "ExamplePass123!",
            "role": "BENEFICIARY",
            "phone": "+919000000001",
            "address": "Demo Beneficiary Address",
            "district": "Chennai",
            "state": "Tamil Nadu",
            "pincode": "600001",
        },
        {
            "email": "donor@example.com",
            "name": "Demo Donor",
            "password": "ExamplePass123!",
            "role": "DONOR",
            "phone": "+919000000002",
        },
        {
            "email": "officer@example.com",
            "name": "Demo Officer",
            "password": "ExamplePass123!",
            "role": "VERIFICATION_OFFICER",
            "phone": "+919000000003",
        },
    ]

    session = db or SessionLocal()
    should_close = db is None
    try:
        for account in demo_accounts:
            existing = session.scalar(select(User).where(User.email == account["email"].lower()))
            if existing:
                existing.name = account["name"]
                existing.password_hash = hash_password(account["password"])
                existing.role = account["role"]
                existing.status = "ACTIVE"
                existing.phone = account.get("phone")
                existing.address = account.get("address")
                existing.district = account.get("district")
                existing.state = account.get("state")
                existing.pincode = account.get("pincode")
                existing.must_change_password = False
            else:
                session.add(User(
                    name=account["name"],
                    email=account["email"].lower(),
                    phone=account.get("phone"),
                    address=account.get("address"),
                    district=account.get("district"),
                    state=account.get("state"),
                    pincode=account.get("pincode"),
                    password_hash=hash_password(account["password"]),
                    role=account["role"],
                    status="ACTIVE",
                    must_change_password=False,
                ))
        session.commit()
    finally:
        if should_close:
            session.close()


@app.on_event("startup")
def startup_event():
    ensure_database_schema()
    ensure_main_admin()
    ensure_demo_accounts()
    try:
        from seed_dummy_data import ensure_complete_seed_data
        seed_db = SessionLocal()
        try:
            ensure_complete_seed_data(seed_db)
        finally:
            seed_db.close()
    except Exception as exc:
        print("Startup seed notice:", exc)


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": settings.app_name,
        "message": "Disaster Relief Verification and Aid Distribution API is operational.",
        "interactive_docs": "/docs",
        "frontend_portal": "http://localhost:5173",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": settings.app_name}


@app.post("/api/auth/beneficiary/register", status_code=status.HTTP_201_CREATED)
def register_beneficiary(payload: BeneficiaryRegisterRequest, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    user = User(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone.strip(),
        address=payload.address.strip(),
        district=payload.district.strip(),
        state=payload.state.strip(),
        pincode=payload.pincode,
        password_hash=hash_password(payload.password),
        role="BENEFICIARY",
        status="ACTIVE",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _audit(db, user, "BENEFICIARY_REGISTERED", "USER", str(user.id), "Beneficiary public registration")
    _notify(db, user.id, "Account created", "Your beneficiary account is ready. Submit an application to begin verification.")
    db.commit()
    return {"message": "Beneficiary account created successfully", "user": _user_response(user)}


@app.post("/api/auth/donor/register", status_code=status.HTTP_201_CREATED)
def register_donor(payload: DonorRegisterRequest, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    user = User(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone.strip() if payload.phone else None,
        password_hash=hash_password(payload.password),
        role="DONOR",
        status="ACTIVE",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _audit(db, user, "DONOR_REGISTERED", "USER", str(user.id), "Donor public registration")
    _notify(db, user.id, "Account created", "Your donor account is ready. You can review public relief summaries and record donation interest.")
    db.commit()
    return {"message": "Donor account created successfully", "user": _user_response(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user and email in {"beneficiary@example.com", "donor@example.com", "officer@example.com"}:
        ensure_demo_accounts(db)
        user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive")
    user.last_login_at = datetime.now(timezone.utc)
    token = create_access_token(user)
    _audit(db, user, "LOGIN", "USER", str(user.id), "Successful login")
    db.commit()
    return {"access_token": token, "token_type": "bearer", "user": _user_response(user)}


@app.post("/api/auth/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.token_version += 1
    db.commit()
    return {"message": "Logout successful"}


@app.get("/api/auth/me")
def current_user(user: User = Depends(get_current_user)):
    return _user_response(user)


@app.post("/api/auth/change-password")
def change_password(payload: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a different password")
    user.password_hash = hash_password(payload.password)
    user.must_change_password = False
    user.token_version += 1
    db.commit()
    token = create_access_token(user)
    return {"message": "Password updated", "access_token": token, "token_type": "bearer", "user": _user_response(user)}


@app.get("/api/admin/officers")
def list_officers(user: User = Depends(require_role("MAIN_ADMIN")), db: Session = Depends(get_db)):
    officers = db.scalars(select(User).where(User.role == "VERIFICATION_OFFICER").order_by(desc(User.created_at))).all()
    return {"items": [{
        "id": item.id,
        "name": item.name,
        "email": item.email,
        "status": item.status,
        "created_at": item.created_at,
        "last_login_at": item.last_login_at,
    } for item in officers], "total": len(officers)}


@app.post("/api/admin/officers", status_code=status.HTTP_201_CREATED)
def create_officer(payload: OfficerCreateRequest, user: User = Depends(require_role("MAIN_ADMIN")), db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An officer with this email already exists")
    officer = User(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
        role="VERIFICATION_OFFICER",
        status=payload.status.upper() if payload.status else "ACTIVE",
        must_change_password=True,
    )
    db.add(officer)
    db.flush()
    _audit(db, user, "OFFICER_CREATED", "USER", str(officer.id), f"Verification officer created: {officer.email}")
    db.commit()
    db.refresh(officer)
    return {"message": "Officer account created successfully", "user": _user_response(officer)}


@app.patch("/api/admin/officers/{officer_id}/password")
def reset_officer_password(officer_id: int, payload: OfficerPasswordResetRequest, user: User = Depends(require_role("MAIN_ADMIN")), db: Session = Depends(get_db)):
    officer = db.get(User, officer_id)
    if not officer or officer.role != "VERIFICATION_OFFICER":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification officer not found")
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    officer.password_hash = hash_password(payload.password)
    officer.must_change_password = True
    officer.token_version += 1
    _audit(db, user, "OFFICER_PASSWORD_RESET", "USER", str(officer.id), "Officer password reset; change required at next login")
    db.commit()
    return {"message": "Officer password reset. They must change it at next login."}


@app.patch("/api/admin/officers/{officer_id}/status")
def update_officer_status(officer_id: int, payload: dict, user: User = Depends(require_role("MAIN_ADMIN")), db: Session = Depends(get_db)):
    officer = db.get(User, officer_id)
    if not officer or officer.role != "VERIFICATION_OFFICER":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification officer not found")
    if payload.get("status") not in {"ACTIVE", "INACTIVE"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be ACTIVE or INACTIVE")
    officer.status = payload["status"]
    officer.updated_at = datetime.now(timezone.utc)
    _audit(db, user, "OFFICER_STATUS_UPDATED", "USER", str(officer.id), f"Officer status changed to {officer.status}")
    db.commit()
    return {"message": "Officer status updated", "id": officer.id, "status": officer.status}


@app.get("/api/donor/overview")
def donor_overview(_: User = Depends(require_role("DONOR")), db: Session = Depends(get_db)):
    registered = db.scalar(select(func.count(User.id)).where(User.role == "BENEFICIARY")) or 0
    verified = db.scalar(select(func.count(Beneficiary.id)).where(Beneficiary.verification_status == "VERIFIED")) or 0
    disaster_counts = db.execute(
        select(Beneficiary.disaster_type, func.count(Beneficiary.id))
        .where(Beneficiary.disaster_type.is_not(None))
        .group_by(Beneficiary.disaster_type)
    ).all()
    return {
        "registered_beneficiaries": registered,
        "verified_beneficiaries": verified,
        "disaster_summary": [{"type": disaster_type, "applications": count} for disaster_type, count in disaster_counts],
    }


@app.get("/api/notifications")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.scalars(
        select(Notification).where(Notification.user_id == user.id).order_by(desc(Notification.created_at)).limit(50)
    ).all()
    return {
        "items": [{
            "id": item.id,
            "title": item.title,
            "message": item.message,
            "is_read": item.is_read,
            "created_at": item.created_at,
        } for item in items],
        "unread": sum(not item.is_read for item in items),
    }


@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@app.post("/api/donor/pledges")
def create_pledge(payload: DonationPledgeCreate, donor: User = Depends(require_role("DONOR")), db: Session = Depends(get_db)):
    pledge = DonationPledge(donor_id=donor.id, amount=payload.amount, campaign=payload.campaign, message=payload.message)
    db.add(pledge)
    _notify(db, donor.id, "Donation interest recorded", "Your pledge is an expression of interest only; no payment was processed.")
    db.commit()
    db.refresh(pledge)
    return {"message": "Donation pledge recorded. This is an expression of interest, not a completed payment.", "pledge": {"id": pledge.id, "amount": pledge.amount, "campaign": pledge.campaign, "message": pledge.message, "created_at": pledge.created_at}}


@app.get("/api/donor/pledges")
def get_pledges(donor: User = Depends(require_role("DONOR")), db: Session = Depends(get_db)):
    items = db.scalars(select(DonationPledge).where(DonationPledge.donor_id == donor.id).order_by(desc(DonationPledge.created_at))).all()
    return {"items": [{"id": item.id, "amount": item.amount, "campaign": item.campaign, "message": item.message, "created_at": item.created_at} for item in items]}


@app.post("/api/beneficiaries", status_code=status.HTTP_201_CREATED)
def create_beneficiary(payload: BeneficiaryCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = normalize_role(user.role)
    if role not in {"MAIN_ADMIN", "VERIFICATION_OFFICER", "BENEFICIARY"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to create an application")
    application_id = f"DR-{uuid4().hex[:8].upper()}"
    identifier = (payload.aadhaar_identifier or "").strip()
    priority = getattr(payload, "priority_level", "NORMAL") or "NORMAL"
    beneficiary = Beneficiary(
        application_id=application_id,
        name=payload.name.strip(),
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        phone=payload.phone.strip(),
        address=payload.address.strip(),
        district=payload.district.strip(),
        state=payload.state.strip(),
        pincode=payload.pincode,
        disaster_type=payload.disaster_type,
        affected_location=payload.affected_location.strip(),
        date_affected=payload.date_affected,
        family_size=payload.family_size,
        number_of_dependents=payload.number_of_dependents,
        masked_aadhaar=mask_aadhaar(identifier) if identifier else None,
        aadhaar_hash=aadhaar_hash(identifier) if identifier else None,
        verification_status="DRAFT" if role == "BENEFICIARY" else "PENDING",
        verification_score=0,
        duplicate_status="NONE",
        priority_level=priority,
        allocation_status="UNALLOCATED",
        delivery_status="PENDING",
        created_by_id=user.id,
    )
    db.add(beneficiary)
    db.flush()

    if getattr(payload, "requested_supplies", None):
        for item in payload.requested_supplies:
            db.add(
                ReliefRequestItem(
                    beneficiary_id=beneficiary.id,
                    item_name=item.item_name,
                    category=item.category,
                    unit=item.unit,
                    quantity_requested=item.quantity_requested,
                    quantity_allocated=0,
                    quantity_delivered=0,
                    status="PENDING",
                )
            )
    else:
        f_size = max(1, payload.family_size or 1)
        defaults = [
            ("Drinking Water Cans (20L)", "Water", "cans", max(2, f_size)),
            ("Ready-to-Eat Meal Packets", "Food", "packets", max(6, f_size * 3)),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", f_size),
        ]
        for name, cat, unit, qty in defaults:
            db.add(
                ReliefRequestItem(
                    beneficiary_id=beneficiary.id,
                    item_name=name,
                    category=cat,
                    unit=unit,
                    quantity_requested=qty,
                    quantity_allocated=0,
                    quantity_delivered=0,
                    status="PENDING",
                )
            )

    _audit(db, user, "BENEFICIARY_CREATED", "BENEFICIARY", application_id, "Application created and pending review", beneficiary.id)
    db.commit()
    db.refresh(beneficiary)
    return {"message": "Beneficiary application created", "beneficiary": _beneficiary_response(beneficiary)}


@app.get("/api/beneficiaries")
def list_beneficiaries(user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    query = select(Beneficiary).order_by(desc(Beneficiary.created_at))
    beneficiaries = db.scalars(query).all()
    return {"items": [_beneficiary_response(item) for item in beneficiaries], "total": len(beneficiaries)}


@app.get("/api/beneficiaries/my-applications")
def my_applications(user: User = Depends(require_role("BENEFICIARY")), db: Session = Depends(get_db)):
    items = db.scalars(select(Beneficiary).where(Beneficiary.created_by_id == user.id).order_by(desc(Beneficiary.created_at))).all()
    results = []
    for item in items:
        latest_record = db.scalar(select(VerificationRecord).where(VerificationRecord.beneficiary_id == item.id).order_by(desc(VerificationRecord.created_at)).limit(1))
        results.append({**_beneficiary_response(item).model_dump(mode="json"), "verification_remarks": latest_record.remarks if latest_record else None})
    return {"items": results, "total": len(results)}


@app.post("/api/beneficiaries/{beneficiary_id}/submit")
def submit_beneficiary_application(beneficiary_id: int, user: User = Depends(require_role("BENEFICIARY")), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary or beneficiary.created_by_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    if beneficiary.verification_status != "DRAFT":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only draft applications can be submitted")
    document = db.scalar(select(Document).where(Document.beneficiary_id == beneficiary.id, Document.document_type == "AADHAAR"))
    if not document:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload an Aadhaar document before submitting")
    duplicate_matches = check_duplicates(db, {
        "aadhaar_hash": beneficiary.aadhaar_hash,
        "exclude_beneficiary_id": beneficiary.id,
        "phone": beneficiary.phone,
        "name": beneficiary.name,
        "date_of_birth": beneficiary.date_of_birth,
        "address": beneficiary.address,
    })
    if duplicate_matches:
        beneficiary.duplicate_status = "FLAGGED"
        beneficiary.duplicate_reason = duplicate_matches[0]["reason"]
        beneficiary.verification_status = "DUPLICATE_FLAGGED"
        db.add(BeneficiaryDuplicate(
            beneficiary_id=beneficiary.id,
            candidate_id=duplicate_matches[0]["beneficiary_id"],
            match_type=duplicate_matches[0]["match_type"],
            reason=duplicate_matches[0]["reason"],
            score=duplicate_matches[0]["score"],
        ))
    else:
        beneficiary.verification_status = "PENDING"
    beneficiary.updated_at = datetime.now(timezone.utc)
    _audit(
        db,
        user,
        "DUPLICATE_DETECTED" if duplicate_matches else "APPLICATION_SUBMITTED",
        "BENEFICIARY",
        beneficiary.application_id,
        duplicate_matches[0]["reason"] if duplicate_matches else "Beneficiary submitted application for review",
        beneficiary.id,
    )
    _notify(
        db,
        user.id,
        "Application flagged for review" if duplicate_matches else "Application submitted",
        "A possible duplicate match needs officer review." if duplicate_matches else "Your application is pending verification by an authorized officer.",
    )
    db.commit()
    return {"message": "Application submitted for officer review", "status": beneficiary.verification_status}


@app.get("/api/beneficiaries/{beneficiary_id}")
def get_beneficiary(beneficiary_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)
    return _beneficiary_response(beneficiary)


@app.put("/api/beneficiaries/{beneficiary_id}")
def update_beneficiary(beneficiary_id: int, payload: BeneficiaryUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    role = normalize_role(user.role)
    if role == "BENEFICIARY":
        if beneficiary.created_by_id != user.id or beneficiary.verification_status != "DRAFT":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only your own draft application can be edited")
    elif role not in {"MAIN_ADMIN", "VERIFICATION_OFFICER"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to update this beneficiary")
    fields = payload.model_dump(exclude_unset=True)
    if "aadhaar_identifier" in fields and fields["aadhaar_identifier"]:
        beneficiary.aadhaar_hash = aadhaar_hash(fields["aadhaar_identifier"])
        beneficiary.masked_aadhaar = mask_aadhaar(fields["aadhaar_identifier"])
    for key, value in fields.items():
        if key != "aadhaar_identifier" and value is not None:
            setattr(beneficiary, key, value)
    beneficiary.updated_at = datetime.now(timezone.utc)
    _audit(db, user, "BENEFICIARY_UPDATED", "BENEFICIARY", beneficiary.application_id, "Beneficiary details updated", beneficiary.id)
    db.commit()
    db.refresh(beneficiary)
    return {"message": "Beneficiary updated", "beneficiary": _beneficiary_response(beneficiary)}


@app.post("/api/aadhaar/upload")
async def upload_document(beneficiary_id: int, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)
    if normalize_role(user.role) == "BENEFICIARY" and beneficiary.verification_status != "DRAFT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Documents can only be changed on your draft application")
    try:
        suffix, content = validate_document(file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    safe_name = f"{beneficiary.application_id}-{uuid4().hex}{suffix}"
    destination = Path(settings.upload_dir) / safe_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    document = Document(
        beneficiary_id=beneficiary.id,
        document_type="AADHAAR",
        file_path=str(destination),
        file_name=safe_name,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        ocr_status="UPLOADED",
    )
    db.add(document)
    db.flush()
    _audit(db, user, "AADHAAR_UPLOADED", "DOCUMENT", str(document.id), "Aadhaar document uploaded", beneficiary.id)
    db.commit()
    return {"message": "Document uploaded securely", "document_id": document.id, "file_name": safe_name}


@app.post("/api/aadhaar/scan")
async def scan_document(beneficiary_id: int, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)
    if normalize_role(user.role) == "BENEFICIARY" and beneficiary.verification_status != "DRAFT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Documents can only be changed on your draft application")
    try:
        suffix, content = validate_document(file)
        extracted = process_document(content, file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    aadhaar_identifier = extracted.pop("aadhaar_identifier", "")
    if aadhaar_identifier:
        beneficiary.masked_aadhaar = mask_aadhaar(aadhaar_identifier)
        beneficiary.aadhaar_hash = aadhaar_hash(aadhaar_identifier)
        extracted["masked_aadhaar"] = beneficiary.masked_aadhaar
    safe_name = f"{beneficiary.application_id}-{uuid4().hex}{suffix}"
    destination = Path(settings.upload_dir) / safe_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    document = Document(
        beneficiary_id=beneficiary.id,
        document_type="AADHAAR",
        file_path=str(destination),
        file_name=safe_name,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        ocr_status="COMPLETED",
        ocr_text=extracted.get("name"),
        extracted_fields=extracted,
    )
    db.add(document)
    db.flush()
    _audit(db, user, "AADHAAR_SCANNED", "DOCUMENT", str(document.id), "OCR processing completed", beneficiary.id)
    _audit(db, user, "OCR_COMPLETED", "BENEFICIARY", beneficiary.application_id, "OCR fields extracted for review", beneficiary.id)
    db.commit()
    return {"message": "OCR extraction completed", "extracted_fields": extracted, "document_id": document.id, "ocr_status": "COMPLETED"}


@app.post("/api/beneficiaries/check-duplicate")
def check_duplicate(payload: DuplicateCheckRequest, user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    candidate = payload.model_dump(exclude_none=True)
    matches = check_duplicates(db, candidate)
    return {"possible_duplicates": matches, "duplicate_found": bool(matches), "message": "Possible duplicate beneficiary detected" if matches else "No duplicate found"}


@app.post("/api/beneficiaries/{beneficiary_id}/verify")
def verify_beneficiary(beneficiary_id: int, payload: VerificationRequest, user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    _ensure_application_submitted(beneficiary)
    if payload.new_status == "VERIFIED" and beneficiary.duplicate_status == "FLAGGED":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Resolve the duplicate flag before verifying this application")
    document = db.scalar(select(Document).where(Document.beneficiary_id == beneficiary_id, Document.ocr_status == "COMPLETED"))
    score = calculate_score({
        "identity_complete": bool(beneficiary.name and beneficiary.date_of_birth and beneficiary.gender and beneficiary.phone),
        "document_available": bool(document),
        "ocr_successful": bool(document and document.extracted_fields.get("name")),
        "duplicate_clear": beneficiary.duplicate_status == "NONE",
        "disaster_information_complete": bool(beneficiary.disaster_type and beneficiary.affected_location and beneficiary.date_affected),
    })
    record = change_status(db, beneficiary, user.id, payload.new_status, score, payload.remarks)
    if payload.new_status == "DUPLICATE_FLAGGED":
        beneficiary.duplicate_status = "FLAGGED"
        beneficiary.duplicate_reason = payload.remarks
    _audit(db, user, "BENEFICIARY_VERIFIED" if payload.new_status == "VERIFIED" else "BENEFICIARY_REVIEWED", "BENEFICIARY", beneficiary.application_id, payload.remarks, beneficiary.id)
    if beneficiary.created_by_id:
        _notify(db, beneficiary.created_by_id, f"Application {payload.new_status.lower().replace('_', ' ')}", payload.remarks)
    db.commit()
    return {"message": f"Beneficiary status changed to {payload.new_status}", "status": payload.new_status, "score": score, "record_id": record.id}


@app.post("/api/beneficiaries/{beneficiary_id}/reject")
def reject_beneficiary(beneficiary_id: int, payload: VerificationRequest, user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    _ensure_application_submitted(beneficiary)
    if not payload.remarks.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A rejection remark is required")
    score = calculate_score({"identity_complete": True, "document_available": bool(db.scalar(select(Document).where(Document.beneficiary_id == beneficiary_id))), "ocr_successful": True, "duplicate_clear": True, "disaster_information_complete": True})
    record = change_status(db, beneficiary, user.id, "REJECTED", score, payload.remarks)
    _audit(db, user, "BENEFICIARY_REJECTED", "BENEFICIARY", beneficiary.application_id, payload.remarks, beneficiary.id)
    if beneficiary.created_by_id:
        _notify(db, beneficiary.created_by_id, "Application rejected", payload.remarks)
    db.commit()
    return {"message": "Beneficiary rejected", "status": "REJECTED", "record_id": record.id}


@app.post("/api/beneficiaries/{beneficiary_id}/flag-duplicate")
def flag_duplicate(beneficiary_id: int, payload: VerificationRequest, user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    _ensure_application_submitted(beneficiary)
    if not payload.remarks.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A duplicate review remark is required")
    beneficiary.duplicate_status = "FLAGGED"
    beneficiary.duplicate_reason = payload.remarks
    record = change_status(db, beneficiary, user.id, "DUPLICATE_FLAGGED", 60, payload.remarks)
    _audit(db, user, "DUPLICATE_FLAGGED", "BENEFICIARY", beneficiary.application_id, payload.remarks, beneficiary.id)
    if beneficiary.created_by_id:
        _notify(db, beneficiary.created_by_id, "Application flagged for duplicate review", payload.remarks)
    db.commit()
    return {"message": "Beneficiary marked as a duplicate flag", "status": "DUPLICATE_FLAGGED", "record_id": record.id}


@app.get("/api/beneficiaries/{beneficiary_id}/history")
def beneficiary_history(beneficiary_id: int, user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    records = db.scalars(select(VerificationRecord).where(VerificationRecord.beneficiary_id == beneficiary_id).order_by(desc(VerificationRecord.created_at))).all()
    return {"records": [{"id": item.id, "officer": item.officer.name, "previous_status": item.previous_status, "new_status": item.new_status, "score": item.score, "remarks": item.remarks, "created_at": item.created_at} for item in records]}


@app.get("/api/dashboard/statistics")
def dashboard_statistics(user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")), db: Session = Depends(get_db)):
    total = db.scalar(select(func.count(Beneficiary.id))) or 0
    pending = db.scalar(select(func.count(Beneficiary.id)).where(Beneficiary.verification_status == "PENDING")) or 0
    under_review = db.scalar(select(func.count(Beneficiary.id)).where(Beneficiary.verification_status == "UNDER_REVIEW")) or 0
    verified = db.scalar(select(func.count(Beneficiary.id)).where(Beneficiary.verification_status == "VERIFIED")) or 0
    rejected = db.scalar(select(func.count(Beneficiary.id)).where(Beneficiary.verification_status == "REJECTED")) or 0
    flagged = db.scalar(select(func.count(Beneficiary.id)).where(Beneficiary.verification_status == "DUPLICATE_FLAGGED")) or 0
    recent = db.scalars(select(Beneficiary).order_by(desc(Beneficiary.created_at)).limit(5)).all()
    recent_activity = db.scalars(select(VerificationRecord).order_by(desc(VerificationRecord.created_at)).limit(5)).all()

    # Dynamic inventory and relief distribution metrics
    total_centres = db.scalar(select(func.count(DistributionCentre.id))) or 0
    total_available_stock = db.scalar(select(func.sum(SupplyInventory.quantity_available))) or 0
    total_allocated_stock = db.scalar(select(func.sum(SupplyInventory.quantity_allocated))) or 0
    total_delivered_stock = db.scalar(select(func.sum(SupplyInventory.quantity_delivered))) or 0

    all_invs = db.scalars(select(SupplyInventory)).all()
    low_stock_count = sum(1 for i in all_invs if 0 < i.quantity_available <= i.low_stock_threshold)
    out_of_stock_count = sum(1 for i in all_invs if i.quantity_available <= 0)

    awaiting_supplies = db.scalar(
        select(func.count(Beneficiary.id)).where(
            Beneficiary.verification_status == "VERIFIED",
            Beneficiary.allocation_status.in_(["AWAITING_SUPPLIES", "UNALLOCATED"]),
        )
    ) or 0

    # Most requested resources dynamically aggregated from real ReliefRequestItem records
    req_totals = db.execute(
        select(ReliefRequestItem.item_name, func.sum(ReliefRequestItem.quantity_requested))
        .group_by(ReliefRequestItem.item_name)
        .order_by(desc(func.sum(ReliefRequestItem.quantity_requested)))
        .limit(8)
    ).all()
    most_requested = [{"resource": row[0], "requested": int(row[1] or 0)} for row in req_totals]

    return {
        "total": total,
        "pending": pending,
        "under_review": under_review,
        "verified": verified,
        "rejected": rejected,
        "flagged": flagged,
        "total_centres": total_centres,
        "total_available_stock": total_available_stock,
        "total_allocated_stock": total_allocated_stock,
        "total_delivered_stock": total_delivered_stock,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "awaiting_supplies": awaiting_supplies,
        "most_requested": most_requested,
        "recent_applications": [
            {
                "id": item.id,
                "application_id": item.application_id,
                "name": item.name,
                "district": item.district,
                "priority_level": item.priority_level,
                "allocation_status": item.allocation_status,
                "verification_status": item.verification_status,
                "created_at": item.created_at,
            }
            for item in recent
        ],
        "recent_activity": [
            {
                "id": item.id,
                "beneficiary_name": item.beneficiary.name,
                "previous_status": item.previous_status,
                "new_status": item.new_status,
                "officer": item.officer.name,
                "created_at": item.created_at,
            }
            for item in recent_activity
        ],
    }


# ==============================================================================
# DISTRIBUTION CENTRES & SUPPLY INVENTORY ENDPOINTS
# ==============================================================================

@app.get("/api/distribution/centres")
def get_distribution_centres(district: str | None = None, db: Session = Depends(get_db)):
    query = select(DistributionCentre)
    if district and district.lower() != "all":
        query = query.where(func.lower(DistributionCentre.district) == district.lower())
    centres = db.scalars(query.order_by(DistributionCentre.name)).all()
    items = []
    for c in centres:
        invs = c.inventories
        in_stock = sum(1 for i in invs if i.quantity_available > i.low_stock_threshold)
        low_stock = sum(1 for i in invs if 0 < i.quantity_available <= i.low_stock_threshold)
        out_of_stock = sum(1 for i in invs if i.quantity_available <= 0)
        items.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "district": c.district,
            "address": c.address,
            "contact_person": c.contact_person,
            "contact_phone": c.contact_phone,
            "contact_email": c.contact_email,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "map_x": c.map_x,
            "map_y": c.map_y,
            "operating_status": c.operating_status,
            "created_at": c.created_at,
            "total_items_count": len(invs),
            "in_stock_count": in_stock,
            "low_stock_count": low_stock,
            "out_of_stock_count": out_of_stock,
            "inventories": [
                {
                    "id": i.id,
                    "centre_id": i.centre_id,
                    "item_name": i.item_name,
                    "category": i.category,
                    "unit": i.unit,
                    "quantity_available": i.quantity_available,
                    "quantity_reserved": i.quantity_reserved,
                    "quantity_allocated": i.quantity_allocated,
                    "quantity_delivered": i.quantity_delivered,
                    "storage_location": i.storage_location,
                    "low_stock_threshold": i.low_stock_threshold,
                    "stock_status": i.stock_status,
                    "centre_name": c.name,
                    "centre_district": c.district,
                }
                for i in invs
            ],
        })
    return {"items": items, "total": len(items)}


@app.get("/api/distribution/centres/{centre_id}")
def get_distribution_centre(centre_id: int, db: Session = Depends(get_db)):
    centre = db.get(DistributionCentre, centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Distribution centre not found")
    invs = centre.inventories
    return {
        "id": centre.id,
        "code": centre.code,
        "name": centre.name,
        "district": centre.district,
        "address": centre.address,
        "contact_person": centre.contact_person,
        "contact_phone": centre.contact_phone,
        "contact_email": centre.contact_email,
        "latitude": centre.latitude,
        "longitude": centre.longitude,
        "map_x": centre.map_x,
        "map_y": centre.map_y,
        "operating_status": centre.operating_status,
        "created_at": centre.created_at,
        "total_items_count": len(invs),
        "in_stock_count": sum(1 for i in invs if i.quantity_available > i.low_stock_threshold),
        "low_stock_count": sum(1 for i in invs if 0 < i.quantity_available <= i.low_stock_threshold),
        "out_of_stock_count": sum(1 for i in invs if i.quantity_available <= 0),
        "inventories": [
            {
                "id": i.id,
                "centre_id": i.centre_id,
                "item_name": i.item_name,
                "category": i.category,
                "unit": i.unit,
                "quantity_available": i.quantity_available,
                "quantity_reserved": i.quantity_reserved,
                "quantity_allocated": i.quantity_allocated,
                "quantity_delivered": i.quantity_delivered,
                "storage_location": i.storage_location,
                "low_stock_threshold": i.low_stock_threshold,
                "stock_status": i.stock_status,
                "centre_name": centre.name,
                "centre_district": centre.district,
            }
            for i in invs
        ],
    }


@app.get("/api/distribution/inventory")
def list_supply_inventory(
    district: str | None = None,
    category: str | None = None,
    stock_status: str | None = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
):
    query = select(SupplyInventory).join(DistributionCentre)
    if district and district.lower() != "all":
        query = query.where(func.lower(DistributionCentre.district) == district.lower())
    if category and category.lower() != "all":
        query = query.where(func.lower(SupplyInventory.category) == category.lower())

    inventories = db.scalars(query.order_by(SupplyInventory.item_name)).all()
    results = []
    for inv in inventories:
        status_val = inv.stock_status
        if low_stock_only and status_val != "Low Stock":
            continue
        if stock_status and stock_status.lower() != "all" and status_val.lower() != stock_status.lower():
            continue
        results.append({
            "id": inv.id,
            "centre_id": inv.centre_id,
            "item_name": inv.item_name,
            "category": inv.category,
            "unit": inv.unit,
            "quantity_available": inv.quantity_available,
            "quantity_reserved": inv.quantity_reserved,
            "quantity_allocated": inv.quantity_allocated,
            "quantity_delivered": inv.quantity_delivered,
            "storage_location": inv.storage_location,
            "low_stock_threshold": inv.low_stock_threshold,
            "stock_status": status_val,
            "centre_name": inv.centre.name,
            "centre_district": inv.centre.district,
        })
    return {"items": results, "total": len(results)}


# ==============================================================================
# SUPPLY ALLOCATION & RECOMMENDATION WORKFLOW
# ==============================================================================

@app.get("/api/beneficiaries/{beneficiary_id}/recommendations")
def get_allocation_recommendations(
    beneficiary_id: int,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    b_coords = DISTRICT_COORDS.get(beneficiary.district or "", (13.0827, 80.2707))
    centres = db.scalars(select(DistributionCentre).where(DistributionCentre.operating_status == "ACTIVE")).all()

    recommendations = []
    for req in beneficiary.request_items:
        remaining = max(0, req.quantity_requested - req.quantity_allocated)

        centre_matches = []
        for c in centres:
            dist = haversine_km(b_coords[0], b_coords[1], c.latitude, c.longitude)
            inv = db.scalar(
                select(SupplyInventory).where(
                    SupplyInventory.centre_id == c.id,
                    func.lower(SupplyInventory.item_name) == func.lower(req.item_name),
                )
            )
            if not inv:
                inv = db.scalar(
                    select(SupplyInventory).where(
                        SupplyInventory.centre_id == c.id,
                        func.lower(SupplyInventory.category) == func.lower(req.category),
                    )
                )

            avail = inv.quantity_available if inv else 0
            centre_matches.append({
                "centre_id": c.id,
                "centre_name": c.name,
                "centre_code": c.code,
                "district": c.district,
                "address": c.address,
                "distance_km": dist,
                "contact_phone": c.contact_phone,
                "inventory_id": inv.id if inv else None,
                "available_stock": avail,
                "unit": inv.unit if inv else req.unit,
                "can_fulfill_full": avail >= remaining if remaining > 0 else False,
                "sufficient_quantity": min(avail, remaining),
            })

        centre_matches.sort(key=lambda x: (0 if x["available_stock"] > 0 else 1, x["distance_km"]))

        recommendations.append({
            "request_item_id": req.id,
            "item_name": req.item_name,
            "category": req.category,
            "unit": req.unit,
            "quantity_requested": req.quantity_requested,
            "quantity_allocated": req.quantity_allocated,
            "quantity_remaining": remaining,
            "recommended_centres": centre_matches,
        })

    return {"beneficiary_id": beneficiary_id, "recommendations": recommendations}


@app.post("/api/beneficiaries/{beneficiary_id}/allocate")
def allocate_supplies(
    beneficiary_id: int,
    payload: SupplyAllocationCreate,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    if beneficiary.verification_status not in {"VERIFIED", "PENDING"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot allocate supplies to a beneficiary with status {beneficiary.verification_status}."
        )

    if beneficiary.verification_status == "PENDING":
        beneficiary.verification_status = "VERIFIED"

    centre = db.get(DistributionCentre, payload.centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Distribution centre not found")

    if not payload.allocations:
        raise HTTPException(status_code=400, detail="No allocation items provided")

    created_allocations = []
    # Atomic transaction
    for alloc_item in payload.allocations:
        inv = db.get(SupplyInventory, alloc_item.inventory_id)
        if not inv or inv.centre_id != centre.id:
            raise HTTPException(status_code=400, detail=f"Inventory item ID {alloc_item.inventory_id} not found at {centre.name}")

        if alloc_item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Allocated quantity must be positive")

        if alloc_item.quantity > inv.quantity_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{inv.item_name}': requested {alloc_item.quantity}, but only {inv.quantity_available} available in stock at {centre.name}."
            )

        inv.quantity_available -= alloc_item.quantity
        inv.quantity_allocated += alloc_item.quantity

        req_item = None
        if alloc_item.request_item_id:
            req_item = db.get(ReliefRequestItem, alloc_item.request_item_id)
            if req_item and req_item.beneficiary_id == beneficiary.id:
                req_item.quantity_allocated += alloc_item.quantity
                if req_item.quantity_allocated >= req_item.quantity_requested:
                    req_item.status = "FULFILLED"
                else:
                    req_item.status = "PARTIAL"

        allocation = SupplyAllocation(
            beneficiary_id=beneficiary.id,
            request_item_id=req_item.id if req_item else None,
            centre_id=centre.id,
            inventory_id=inv.id,
            officer_id=user.id,
            quantity_allocated=alloc_item.quantity,
            quantity_delivered=0,
            unit=inv.unit,
            status="ALLOCATED",
            notes=alloc_item.notes or f"Allocated by {user.name} from {centre.name}",
            allocated_at=datetime.now(timezone.utc),
        )
        db.add(allocation)
        created_allocations.append(allocation)

    db.flush()

    all_req_items = beneficiary.request_items
    if all_req_items:
        if all(item.status == "FULFILLED" for item in all_req_items):
            beneficiary.allocation_status = "FULLY_ALLOCATED"
        elif any(item.quantity_allocated > 0 for item in all_req_items):
            beneficiary.allocation_status = "PARTIALLY_ALLOCATED"
    else:
        beneficiary.allocation_status = "FULLY_ALLOCATED"

    _audit(
        db,
        user,
        "SUPPLIES_ALLOCATED",
        "BENEFICIARY",
        beneficiary.application_id,
        f"Allocated {len(created_allocations)} supply items from {centre.name}",
        beneficiary.id,
    )
    if beneficiary.created_by_id:
        _notify(
            db,
            beneficiary.created_by_id,
            "Relief supplies allocated",
            f"Relief supplies for application {beneficiary.application_id} have been allocated from {centre.name}."
        )

    db.commit()
    return {
        "message": f"Successfully allocated {len(created_allocations)} supply item(s)",
        "allocation_status": beneficiary.allocation_status,
        "allocations": [
            {
                "id": a.id,
                "beneficiary_id": a.beneficiary_id,
                "centre_name": centre.name,
                "item_name": a.inventory.item_name,
                "quantity_allocated": a.quantity_allocated,
                "unit": a.unit,
                "status": a.status,
                "allocated_at": a.allocated_at,
            }
            for a in created_allocations
        ],
    }


@app.post("/api/allocations/{allocation_id}/dispatch")
def dispatch_allocation(
    allocation_id: int,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    alloc = db.get(SupplyAllocation, allocation_id)
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    if alloc.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cancelled allocation cannot be dispatched")
    alloc.status = "DISPATCHED"
    alloc.dispatched_at = datetime.now(timezone.utc)
    beneficiary = alloc.beneficiary
    if beneficiary.delivery_status == "PENDING":
        beneficiary.delivery_status = "DISPATCHED"

    _audit(
        db, user, "SUPPLIES_DISPATCHED", "ALLOCATION", str(alloc.id),
        f"Supplies dispatched from {alloc.centre.name} to {beneficiary.name}", beneficiary.id
    )
    if beneficiary.created_by_id:
        _notify(
            db, beneficiary.created_by_id, "Relief Supplies Dispatched",
            f"Your supplies ({alloc.inventory.item_name}) have been dispatched from {alloc.centre.name}."
        )
    db.commit()
    return {"message": "Allocation marked as dispatched", "allocation_id": alloc.id, "status": alloc.status}


@app.post("/api/allocations/{allocation_id}/deliver")
def deliver_allocation(
    allocation_id: int,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    alloc = db.get(SupplyAllocation, allocation_id)
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    if alloc.status == "DELIVERED":
        return {"message": "Allocation already marked as delivered", "allocation_id": alloc.id}
    if alloc.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cancelled allocation cannot be delivered")

    alloc.status = "DELIVERED"
    alloc.delivered_at = datetime.now(timezone.utc)
    alloc.quantity_delivered = alloc.quantity_allocated

    # Update inventory delivered quantity
    inv = alloc.inventory
    inv.quantity_delivered += alloc.quantity_allocated

    # Update request item delivered quantity
    if alloc.request_item:
        alloc.request_item.quantity_delivered += alloc.quantity_allocated

    beneficiary = alloc.beneficiary
    # Check if all allocations for this beneficiary are delivered
    other_allocs = db.scalars(select(SupplyAllocation).where(SupplyAllocation.beneficiary_id == beneficiary.id)).all()
    if all(a.status == "DELIVERED" for a in other_allocs):
        beneficiary.delivery_status = "DELIVERED"
    else:
        beneficiary.delivery_status = "PARTIALLY_DELIVERED"

    _audit(
        db, user, "SUPPLIES_DELIVERED", "ALLOCATION", str(alloc.id),
        f"Supplies confirmed delivered to {beneficiary.name}", beneficiary.id
    )
    if beneficiary.created_by_id:
        _notify(
            db, beneficiary.created_by_id, "Relief Supplies Delivered",
            f"Your allocated supplies ({alloc.inventory.item_name}) have been confirmed delivered."
        )
    db.commit()
    return {"message": "Allocation marked as delivered", "allocation_id": alloc.id, "delivery_status": beneficiary.delivery_status}


@app.get("/api/beneficiaries/{beneficiary_id}/allocations")
def get_beneficiary_allocations(
    beneficiary_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)

    allocations = db.scalars(
        select(SupplyAllocation).where(SupplyAllocation.beneficiary_id == beneficiary_id).order_by(desc(SupplyAllocation.allocated_at))
    ).all()
    return {
        "items": [
            {
                "id": a.id,
                "beneficiary_id": a.beneficiary_id,
                "request_item_id": a.request_item_id,
                "centre_id": a.centre_id,
                "centre_name": a.centre.name,
                "centre_district": a.centre.district,
                "inventory_id": a.inventory_id,
                "item_name": a.inventory.item_name,
                "category": a.inventory.category,
                "quantity_allocated": a.quantity_allocated,
                "quantity_delivered": a.quantity_delivered,
                "unit": a.unit,
                "status": a.status,
                "notes": a.notes,
                "officer_name": a.officer.name if a.officer else "Authorized Officer",
                "allocated_at": a.allocated_at,
                "dispatched_at": a.dispatched_at,
                "delivered_at": a.delivered_at,
            }
            for a in allocations
        ],
        "total": len(allocations),
    }


@app.get("/api/audit-logs")
def audit_logs(user: User = Depends(require_role("MAIN_ADMIN")), db: Session = Depends(get_db)):
    records = db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at))).all()
    return {"items": [AuditResponse(
        id=item.id,
        user_name=item.user.name if item.user else None,
        action=item.action,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        remarks=item.remarks,
        created_at=item.created_at,
    ) for item in records]}



def _distribution_response(dist: ReliefDistribution) -> ReliefDistributionResponse:
    centre_name = None
    if dist.centre:
        centre_name = dist.centre.name
    elif dist.items and dist.items[0].allocation and dist.items[0].allocation.centre:
        centre_name = dist.items[0].allocation.centre.name

    return ReliefDistributionResponse(
        id=dist.id,
        distribution_ref=dist.distribution_ref,
        beneficiary_id=dist.beneficiary_id,
        beneficiary_name=dist.beneficiary.name if dist.beneficiary else None,
        application_id=dist.beneficiary.application_id if dist.beneficiary else None,
        officer_id=dist.officer_id,
        officer_name=dist.officer.name if dist.officer else "Authorized Officer",
        centre_id=dist.centre_id,
        centre_name=centre_name,
        status=dist.status,
        distributed_at=dist.distributed_at,
        confirmed_at=dist.confirmed_at,
        officer_notes=dist.officer_notes,
        beneficiary_feedback=dist.beneficiary_feedback,
        discrepancy_details=dist.discrepancy_details,
        items=[
            ReliefDistributionItemResponse(
                id=item.id,
                distribution_id=item.distribution_id,
                allocation_id=item.allocation_id,
                item_name=item.item_name,
                category=item.category,
                unit=item.unit,
                quantity_allocated=item.quantity_allocated,
                quantity_distributed=item.quantity_distributed,
                quantity_received=item.quantity_received,
                quantity_missing=item.quantity_missing,
                item_status=item.item_status,
                notes=item.notes,
            )
            for item in dist.items
        ]
    )


@app.post("/api/distributions/handover")
def handover_distribution(
    payload: DistributionHandoverRequest,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, payload.beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="At least one supply item must be distributed")

    now = datetime.now(timezone.utc)
    dist_ref = f"DIST-{now.strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}"

    distribution = ReliefDistribution(
        distribution_ref=dist_ref,
        beneficiary_id=beneficiary.id,
        officer_id=user.id,
        centre_id=payload.centre_id,
        status="Distributed – Awaiting Beneficiary Confirmation",
        distributed_at=now,
        officer_notes=payload.officer_notes,
    )
    db.add(distribution)
    db.flush()

    for item_in in payload.items:
        alloc = None
        if item_in.allocation_id:
            alloc = db.get(SupplyAllocation, item_in.allocation_id)
            if alloc and alloc.beneficiary_id != beneficiary.id:
                raise HTTPException(status_code=400, detail="Allocation does not belong to this beneficiary")

        item_name = item_in.item_name or (alloc.inventory.item_name if alloc and alloc.inventory else "Relief Item")
        category = (alloc.inventory.category if alloc and alloc.inventory else None)
        unit = item_in.unit or (alloc.unit if alloc else "units")
        qty_allocated = item_in.quantity_allocated if item_in.quantity_allocated is not None else (alloc.quantity_allocated if alloc else item_in.quantity_distributed)

        dist_item = ReliefDistributionItem(
            distribution_id=distribution.id,
            allocation_id=alloc.id if alloc else None,
            inventory_id=alloc.inventory_id if alloc else item_in.inventory_id,
            item_name=item_name,
            category=category,
            unit=unit,
            quantity_allocated=qty_allocated,
            quantity_distributed=item_in.quantity_distributed,
            quantity_received=None,
            quantity_missing=0,
            item_status="Distributed – Awaiting Beneficiary Confirmation",
            notes=item_in.notes,
        )
        db.add(dist_item)

        if alloc:
            alloc.status = "DISPATCHED"
            alloc.dispatched_at = now

    beneficiary.delivery_status = "DISPATCHED"

    _audit(
        db,
        user,
        "SUPPLIES_DISTRIBUTED",
        "DISTRIBUTION",
        distribution.distribution_ref,
        f"Handed over {len(payload.items)} item(s) to {beneficiary.name} (Ref: {dist_ref})",
        beneficiary.id,
    )
    if beneficiary.created_by_id:
        _notify(
            db,
            beneficiary.created_by_id,
            "Relief supplies handed over",
            f"Relief supplies ({dist_ref}) have been distributed. Please check 'My Relief Distribution' on your dashboard to confirm receipt."
        )

    db.commit()
    db.refresh(distribution)
    return {
        "message": "Supplies successfully marked as distributed. Awaiting beneficiary receipt confirmation.",
        "distribution": _distribution_response(distribution)
    }


@app.post("/api/distributions/{distribution_id}/confirm")
def confirm_distribution_receipt(
    distribution_id: int,
    payload: DistributionConfirmRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    distribution = db.get(ReliefDistribution, distribution_id)
    if not distribution:
        raise HTTPException(status_code=404, detail="Distribution record not found")

    beneficiary = distribution.beneficiary
    role = normalize_role(user.role)
    if role == "BENEFICIARY":
        if beneficiary.created_by_id != user.id:
            raise HTTPException(status_code=403, detail="You can only confirm your own relief distribution")
    elif role not in {"MAIN_ADMIN", "VERIFICATION_OFFICER"}:
        raise HTTPException(status_code=403, detail="Not authorized to confirm distribution")

    final_statuses = {
        "Fully Received – Confirmed",
        "Partially Received",
        "Not Received",
        "Issue Reported",
    }
    if distribution.status in final_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"This distribution has already been confirmed as '{distribution.status}' and cannot be resubmitted."
        )

    action = payload.action.strip().upper()
    valid_actions = {"CONFIRM_ALL", "PARTIALLY_RECEIVED", "NOT_RECEIVED", "REPORT_ISSUE"}
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action '{action}'. Must be one of {valid_actions}")

    now = datetime.now(timezone.utc)
    distribution.confirmed_at = now
    distribution.beneficiary_feedback = payload.feedback

    missing_map = {item.item_id: item for item in payload.missing_items}

    if action == "CONFIRM_ALL":
        distribution.status = "Fully Received – Confirmed"
        for item in distribution.items:
            item.quantity_received = item.quantity_distributed
            item.quantity_missing = 0
            item.item_status = "Fully Received – Confirmed"
            if item.allocation:
                item.allocation.status = "DELIVERED"
                item.allocation.delivered_at = now
                item.allocation.quantity_delivered = item.quantity_distributed
                if item.allocation.inventory:
                    item.allocation.inventory.quantity_delivered += item.quantity_distributed
        beneficiary.delivery_status = "DELIVERED"

    elif action == "PARTIALLY_RECEIVED":
        distribution.status = "Partially Received"
        missing_notes = []
        for item in distribution.items:
            confirm_info = missing_map.get(item.id)
            if confirm_info:
                received = min(confirm_info.quantity_received, item.quantity_distributed)
                missing = max(0, item.quantity_distributed - received)
                item.quantity_received = received
                item.quantity_missing = missing
                item.item_status = "Partially Received" if missing > 0 else "Fully Received – Confirmed"
                if confirm_info.reason:
                    item.notes = (item.notes or "") + f" [Beneficiary: {confirm_info.reason}]"
                    missing_notes.append(f"{item.item_name}: received {received}/{item.quantity_distributed} ({confirm_info.reason})")
            else:
                item.quantity_received = item.quantity_distributed
                item.quantity_missing = 0
                item.item_status = "Fully Received – Confirmed"
            if item.allocation:
                item.allocation.quantity_delivered = item.quantity_received or 0
                item.allocation.status = "PARTIAL" if item.quantity_missing else "DELIVERED"
        if missing_notes:
            distribution.discrepancy_details = "; ".join(missing_notes)
        beneficiary.delivery_status = "PARTIALLY_DELIVERED"

    elif action == "NOT_RECEIVED":
        distribution.status = "Not Received"
        for item in distribution.items:
            item.quantity_received = 0
            item.quantity_missing = item.quantity_distributed
            item.item_status = "Not Received"
        distribution.discrepancy_details = payload.feedback or "Beneficiary reported zero items received."
        beneficiary.delivery_status = "UNDELIVERED"

    elif action == "REPORT_ISSUE":
        distribution.status = "Issue Reported"
        distribution.discrepancy_details = payload.feedback or "Issue reported with received items."
        for item in distribution.items:
            confirm_info = missing_map.get(item.id)
            if confirm_info:
                item.quantity_received = min(confirm_info.quantity_received, item.quantity_distributed)
                item.quantity_missing = max(0, item.quantity_distributed - item.quantity_received)
                item.item_status = "Issue Reported"
                if confirm_info.reason:
                    item.notes = (item.notes or "") + f" [Issue: {confirm_info.reason}]"
            else:
                item.item_status = "Issue Reported"
        beneficiary.delivery_status = "ISSUE_REPORTED"

    confirmation_log = DistributionConfirmation(
        distribution_id=distribution.id,
        beneficiary_id=beneficiary.id,
        user_id=user.id,
        action=action,
        status_applied=distribution.status,
        feedback=payload.feedback,
        missing_details={"items": [m.model_dump() for m in payload.missing_items]} if payload.missing_items else None,
        created_at=now,
    )
    db.add(confirmation_log)

    _audit(
        db,
        user,
        "DISTRIBUTION_RECEIPT_CONFIRMED",
        "DISTRIBUTION",
        distribution.distribution_ref,
        f"Beneficiary confirmed receipt as '{distribution.status}'. Feedback: {payload.feedback or 'None'}",
        beneficiary.id,
    )

    if distribution.officer_id:
        _notify(
            db,
            distribution.officer_id,
            f"Receipt Confirmation: {distribution.distribution_ref}",
            f"Beneficiary {beneficiary.name} marked distribution as '{distribution.status}'."
        )

    db.commit()
    db.refresh(distribution)
    return {
        "message": f"Receipt confirmation recorded successfully as '{distribution.status}'.",
        "distribution": _distribution_response(distribution)
    }


@app.get("/api/distributions/my-distributions")
def get_my_distributions(
    user: User = Depends(require_role("BENEFICIARY")),
    db: Session = Depends(get_db),
):
    b_ids = db.scalars(select(Beneficiary.id).where(Beneficiary.created_by_id == user.id)).all()
    if not b_ids:
        return {"items": [], "total": 0}

    distributions = db.scalars(
        select(ReliefDistribution)
        .where(ReliefDistribution.beneficiary_id.in_(b_ids))
        .order_by(desc(ReliefDistribution.distributed_at))
    ).all()

    return {
        "items": [_distribution_response(d) for d in distributions],
        "total": len(distributions)
    }


@app.get("/api/distributions/beneficiary/{beneficiary_id}")
def get_beneficiary_distributions(
    beneficiary_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)

    distributions = db.scalars(
        select(ReliefDistribution)
        .where(ReliefDistribution.beneficiary_id == beneficiary_id)
        .order_by(desc(ReliefDistribution.distributed_at))
    ).all()

    return {
        "items": [_distribution_response(d) for d in distributions],
        "total": len(distributions)
    }


@app.get("/api/distributions/tracking-summary")
def get_distribution_tracking_summary(
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    total_allocated_beneficiaries = db.scalar(
        select(func.count(func.distinct(SupplyAllocation.beneficiary_id)))
    ) or 0

    all_distributions = db.scalars(
        select(ReliefDistribution).order_by(desc(ReliefDistribution.distributed_at))
    ).all()

    total_completed = sum(1 for d in all_distributions if d.status == "Fully Received – Confirmed")

    confirmed_statuses = {"Fully Received – Confirmed", "Partially Received", "Not Received", "Issue Reported"}
    beneficiaries_confirmed = len(set(d.beneficiary_id for d in all_distributions if d.status in confirmed_statuses))

    pending_confirmations = sum(1 for d in all_distributions if d.status == "Distributed – Awaiting Beneficiary Confirmation")

    partial_or_unsuccessful = sum(1 for d in all_distributions if d.status in {"Partially Received", "Not Received"})

    reported_discrepancies = sum(1 for d in all_distributions if d.status == "Issue Reported" or (d.discrepancy_details and d.discrepancy_details.strip()))

    return {
        "total_beneficiaries_with_allocations": total_allocated_beneficiaries,
        "total_distributions_completed": total_completed,
        "beneficiaries_confirmed_receipt": beneficiaries_confirmed,
        "pending_confirmations": pending_confirmations,
        "partial_or_unsuccessful": partial_or_unsuccessful,
        "reported_discrepancies": reported_discrepancies,
        "distributions": [_distribution_response(d) for d in all_distributions[:100]]
    }



# -------------------------------------------------------------
# AVAILABLE SUPPLIES MANAGEMENT & BENEFICIARY REQUEST ENDPOINTS
# -------------------------------------------------------------

def _supply_request_response(req: BeneficiarySupplyRequest) -> BeneficiarySupplyRequestResponse:
    b = req.beneficiary
    return BeneficiarySupplyRequestResponse(
        id=req.id,
        request_ref=req.request_ref,
        beneficiary_id=req.beneficiary_id,
        beneficiary_name=b.name if b else None,
        application_id=b.application_id if b else None,
        district=b.district if b else None,
        priority_level=b.priority_level if b else "NORMAL",
        family_size=b.family_size if b else 1,
        status=req.status,
        notes=req.notes,
        reviewed_by_id=req.reviewed_by_id,
        reviewed_by_name=req.reviewed_by.name if req.reviewed_by else None,
        reviewed_at=req.reviewed_at,
        officer_remarks=req.officer_remarks,
        created_at=req.created_at,
        updated_at=req.updated_at,
        items=[
            BeneficiarySupplyRequestItemResponse(
                id=item.id,
                request_id=item.request_id,
                inventory_id=item.inventory_id,
                item_name=item.item_name,
                category=item.category,
                unit=item.unit,
                quantity_requested=item.quantity_requested,
                quantity_approved=item.quantity_approved,
                status=item.status,
                decision_reason=item.decision_reason,
                allocation_id=item.allocation_id,
                available_stock=item.inventory.quantity_available if item.inventory else 0,
            )
            for item in req.items
        ]
    )


@app.post("/api/distribution/inventory", status_code=status.HTTP_201_CREATED)
def create_supply_inventory(
    payload: SupplyInventoryCreate,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    centre = db.get(DistributionCentre, payload.centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Distribution centre not found")

    inv = SupplyInventory(
        centre_id=centre.id,
        item_name=payload.item_name.strip(),
        category=payload.category.strip(),
        unit=payload.unit.strip(),
        quantity_available=payload.quantity_available,
        quantity_reserved=0,
        quantity_allocated=0,
        quantity_delivered=0,
        storage_location=payload.storage_location.strip(),
        low_stock_threshold=payload.low_stock_threshold,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    _audit(
        db, user, "INVENTORY_CREATED", "SUPPLY_INVENTORY", str(inv.id),
        f"Added '{inv.item_name}' ({inv.quantity_available} {inv.unit}) at {centre.name}"
    )
    return SupplyInventoryResponse(
        id=inv.id,
        centre_id=inv.centre_id,
        item_name=inv.item_name,
        category=inv.category,
        unit=inv.unit,
        quantity_available=inv.quantity_available,
        quantity_reserved=inv.quantity_reserved,
        quantity_allocated=inv.quantity_allocated,
        quantity_delivered=inv.quantity_delivered,
        storage_location=inv.storage_location,
        low_stock_threshold=inv.low_stock_threshold,
        stock_status=inv.stock_status,
        centre_name=centre.name,
        centre_district=centre.district,
        description=inv.description,
    )


@app.put("/api/distribution/inventory/{inventory_id}")
def update_supply_inventory(
    inventory_id: int,
    payload: SupplyInventoryUpdate,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    inv = db.get(SupplyInventory, inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if payload.item_name is not None:
        inv.item_name = payload.item_name.strip()
    if payload.category is not None:
        inv.category = payload.category.strip()
    if payload.unit is not None:
        inv.unit = payload.unit.strip()
    if payload.quantity_available is not None:
        inv.quantity_available = payload.quantity_available
    if payload.low_stock_threshold is not None:
        inv.low_stock_threshold = payload.low_stock_threshold
    if payload.storage_location is not None:
        inv.storage_location = payload.storage_location.strip()
    if payload.description is not None:
        inv.description = payload.description.strip() or None

    inv.updated_at = datetime.now(timezone.utc)
    _audit(db, user, "INVENTORY_UPDATED", "SUPPLY_INVENTORY", str(inv.id), f"Updated '{inv.item_name}' details")
    db.commit()
    db.refresh(inv)

    return SupplyInventoryResponse(
        id=inv.id,
        centre_id=inv.centre_id,
        item_name=inv.item_name,
        category=inv.category,
        unit=inv.unit,
        quantity_available=inv.quantity_available,
        quantity_reserved=inv.quantity_reserved,
        quantity_allocated=inv.quantity_allocated,
        quantity_delivered=inv.quantity_delivered,
        storage_location=inv.storage_location,
        low_stock_threshold=inv.low_stock_threshold,
        stock_status=inv.stock_status,
        centre_name=inv.centre.name if inv.centre else None,
        centre_district=inv.centre.district if inv.centre else None,
        description=inv.description,
    )


@app.post("/api/distribution/inventory/{inventory_id}/restock")
def restock_supply_inventory(
    inventory_id: int,
    payload: SupplyInventoryRestockRequest,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    inv = db.get(SupplyInventory, inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    old_qty = inv.quantity_available
    inv.quantity_available += payload.quantity_added
    inv.updated_at = datetime.now(timezone.utc)

    remarks = f"Restocked +{payload.quantity_added} {inv.unit} (From {old_qty} to {inv.quantity_available})."
    if payload.source_notes:
        remarks += f" Note: {payload.source_notes}"

    _audit(db, user, "INVENTORY_RESTOCKED", "SUPPLY_INVENTORY", str(inv.id), remarks)
    db.commit()
    db.refresh(inv)

    return {
        "message": f"Successfully restocked {payload.quantity_added} {inv.unit} of '{inv.item_name}'.",
        "inventory": SupplyInventoryResponse(
            id=inv.id,
            centre_id=inv.centre_id,
            item_name=inv.item_name,
            category=inv.category,
            unit=inv.unit,
            quantity_available=inv.quantity_available,
            quantity_reserved=inv.quantity_reserved,
            quantity_allocated=inv.quantity_allocated,
            quantity_delivered=inv.quantity_delivered,
            storage_location=inv.storage_location,
            low_stock_threshold=inv.low_stock_threshold,
            stock_status=inv.stock_status,
            centre_name=inv.centre.name if inv.centre else None,
            centre_district=inv.centre.district if inv.centre else None,
            description=inv.description,
        )
    }


@app.get("/api/distribution/available-supplies")
def get_available_supplies(
    centre_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve items currently available in stock for beneficiaries to request."""
    query = select(SupplyInventory).where(SupplyInventory.quantity_available > 0)
    if centre_id:
        query = query.where(SupplyInventory.centre_id == centre_id)
    inventories = db.scalars(query.order_by(SupplyInventory.category, SupplyInventory.item_name)).all()

    catalog: dict[str, dict] = {}
    for inv in inventories:
        if inv.item_name not in catalog:
            catalog[inv.item_name] = {
                "id": inv.id,
                "centre_id": inv.centre_id,
                "item_name": inv.item_name,
                "category": inv.category,
                "unit": inv.unit,
                "quantity_available": inv.quantity_available,
                "quantity_reserved": getattr(inv, "quantity_reserved", 0),
                "quantity_allocated": inv.quantity_allocated,
                "quantity_delivered": inv.quantity_delivered,
                "low_stock_threshold": inv.low_stock_threshold,
                "storage_location": inv.storage_location,
                "stock_status": inv.stock_status,
                "centre_name": inv.centre.name if inv.centre else None,
                "centre_district": inv.centre.district if inv.centre else None,
                "description": inv.description,
            }
        else:
            catalog[inv.item_name]["quantity_available"] += inv.quantity_available

    return {"items": [SupplyInventoryResponse(**v) for v in catalog.values()], "total": len(catalog)}


@app.post("/api/supply-requests", status_code=status.HTTP_201_CREATED)
def create_supply_request(
    payload: SupplyRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, payload.beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)

    now = datetime.now(timezone.utc)
    request_ref = f"REQ-{now.strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}"

    supply_request = BeneficiarySupplyRequest(
        request_ref=request_ref,
        beneficiary_id=beneficiary.id,
        status="PENDING",
        notes=payload.notes,
        created_at=now,
    )
    db.add(supply_request)
    db.flush()

    for item_in in payload.items:
        if item_in.quantity_requested <= 0:
            raise HTTPException(status_code=400, detail="Requested quantity must be greater than zero")

        inv = db.get(SupplyInventory, item_in.inventory_id)
        if not inv:
            raise HTTPException(status_code=400, detail=f"Supply item ID {item_in.inventory_id} does not exist")

        req_item = BeneficiarySupplyRequestItem(
            request_id=supply_request.id,
            inventory_id=inv.id,
            item_name=inv.item_name,
            category=inv.category,
            unit=inv.unit,
            quantity_requested=item_in.quantity_requested,
            quantity_approved=0,
            status="PENDING",
        )
        db.add(req_item)

    _audit(
        db, user, "SUPPLY_REQUEST_SUBMITTED", "SUPPLY_REQUEST",
        request_ref, f"Beneficiary {beneficiary.name} requested {len(payload.items)} supply item(s)",
        beneficiary.id
    )

    db.commit()
    db.refresh(supply_request)
    return {
        "message": "Relief supply request submitted successfully. It will be reviewed by an authorized relief officer.",
        "request": _supply_request_response(supply_request)
    }


@app.get("/api/supply-requests/mine")
def get_my_supply_requests(
    user: User = Depends(require_role("BENEFICIARY")),
    db: Session = Depends(get_db),
):
    b_ids = db.scalars(select(Beneficiary.id).where(Beneficiary.created_by_id == user.id)).all()
    if not b_ids:
        return {"items": [], "total": 0}

    requests = db.scalars(
        select(BeneficiarySupplyRequest)
        .where(BeneficiarySupplyRequest.beneficiary_id.in_(b_ids))
        .order_by(desc(BeneficiarySupplyRequest.created_at))
    ).all()

    return {
        "items": [_supply_request_response(r) for r in requests],
        "total": len(requests)
    }


@app.get("/api/supply-requests/all")
def get_all_supply_requests(
    status_filter: str | None = None,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    query = select(BeneficiarySupplyRequest).order_by(desc(BeneficiarySupplyRequest.created_at))
    if status_filter and status_filter.upper() != "ALL":
        query = query.where(BeneficiarySupplyRequest.status == status_filter.upper())

    requests = db.scalars(query).all()
    return {
        "items": [_supply_request_response(r) for r in requests],
        "total": len(requests)
    }


@app.get("/api/supply-requests/beneficiary/{beneficiary_id}")
def get_beneficiary_supply_requests(
    beneficiary_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, beneficiary_id)
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    _authorize_beneficiary_access(user, beneficiary)

    requests = db.scalars(
        select(BeneficiarySupplyRequest)
        .where(BeneficiarySupplyRequest.beneficiary_id == beneficiary_id)
        .order_by(desc(BeneficiarySupplyRequest.created_at))
    ).all()

    return {
        "items": [_supply_request_response(r) for r in requests],
        "total": len(requests)
    }


@app.post("/api/supply-requests/{request_id}/review")
def review_supply_request(
    request_id: int,
    payload: SupplyRequestReviewDecision,
    user: User = Depends(require_role("MAIN_ADMIN", "VERIFICATION_OFFICER")),
    db: Session = Depends(get_db),
):
    req = db.get(BeneficiarySupplyRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Supply request not found")

    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request {req.request_ref} has already been reviewed ({req.status}).")

    beneficiary = req.beneficiary
    now = datetime.now(timezone.utc)

    review_map = {item.item_id: item for item in payload.items}
    created_allocations = []
    has_approval = False
    has_partial_or_rejection = False

    for item in req.items:
        decision = review_map.get(item.id)
        if not decision:
            raise HTTPException(status_code=400, detail=f"Missing review decision for item '{item.item_name}'")

        action = decision.action.strip().upper()
        if action not in {"APPROVE_FULL", "APPROVE_PARTIAL", "REJECT"}:
            raise HTTPException(status_code=400, detail=f"Invalid action '{action}'. Must be APPROVE_FULL, APPROVE_PARTIAL, or REJECT.")

        inv = item.inventory
        if not inv:
            inv = db.get(SupplyInventory, item.inventory_id)

        if action == "APPROVE_FULL":
            qty = item.quantity_requested
            item.status = "APPROVED"
            has_approval = True
        elif action == "APPROVE_PARTIAL":
            qty = decision.quantity_approved
            if qty <= 0 or qty >= item.quantity_requested:
                raise HTTPException(status_code=400, detail=f"Partial approval quantity for '{item.item_name}' must be between 1 and {item.quantity_requested - 1}")
            if not decision.reason or not decision.reason.strip():
                raise HTTPException(status_code=400, detail=f"A reason is required when partially approving '{item.item_name}'")
            item.status = "PARTIALLY_APPROVED"
            item.decision_reason = decision.reason.strip()
            has_approval = True
            has_partial_or_rejection = True
        elif action == "REJECT":
            qty = 0
            if not decision.reason or not decision.reason.strip():
                raise HTTPException(status_code=400, detail=f"A reason is required when rejecting '{item.item_name}'")
            item.status = "REJECTED"
            item.decision_reason = decision.reason.strip()
            has_partial_or_rejection = True

        item.quantity_approved = qty

        # Stock deduction & allocation creation
        if qty > 0:
            if qty > inv.quantity_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{inv.item_name}': requested approval of {qty} {inv.unit}, but only {inv.quantity_available} available in stock at {inv.centre.name if inv.centre else 'warehouse'}."
                )

            inv.quantity_available -= qty
            inv.quantity_allocated += qty

            # Create or link ReliefRequestItem
            req_item = ReliefRequestItem(
                beneficiary_id=beneficiary.id,
                item_name=item.item_name,
                category=item.category or "General",
                unit=item.unit,
                quantity_requested=item.quantity_requested,
                quantity_allocated=qty,
                quantity_delivered=0,
                status="FULFILLED" if qty >= item.quantity_requested else "PARTIAL",
            )
            db.add(req_item)
            db.flush()

            # Create SupplyAllocation record
            alloc = SupplyAllocation(
                beneficiary_id=beneficiary.id,
                request_item_id=req_item.id,
                centre_id=inv.centre_id,
                inventory_id=inv.id,
                officer_id=user.id,
                quantity_allocated=qty,
                quantity_delivered=0,
                unit=inv.unit,
                status="ALLOCATED",
                notes=f"Approved from request {req.request_ref}. {decision.reason or ''}".strip(),
                allocated_at=now,
            )
            db.add(alloc)
            db.flush()
            item.allocation_id = alloc.id
            created_allocations.append(alloc)

    # Determine overall request status
    if has_approval and not has_partial_or_rejection:
        req.status = "APPROVED"
    elif has_approval and has_partial_or_rejection:
        req.status = "PARTIALLY_APPROVED"
    else:
        req.status = "REJECTED"

    req.reviewed_by_id = user.id
    req.reviewed_at = now
    req.officer_remarks = payload.officer_remarks
    req.updated_at = now

    if created_allocations:
        beneficiary.allocation_status = "FULLY_ALLOCATED" if req.status == "APPROVED" else "PARTIALLY_ALLOCATED"

    _audit(
        db, user, "SUPPLY_REQUEST_REVIEWED", "SUPPLY_REQUEST",
        req.request_ref, f"Reviewed request {req.request_ref} ({req.status}). Allocated {len(created_allocations)} item(s).",
        beneficiary.id
    )

    if beneficiary.created_by_id:
        _notify(
            db, beneficiary.created_by_id,
            f"Relief Supply Request {req.status.replace('_', ' ').title()}",
            f"Your relief supply request {req.request_ref} has been reviewed ({req.status.replace('_', ' ')}). Approved items have been allocated."
        )

    db.commit()
    db.refresh(req)
    return {
        "message": f"Supply request {req.request_ref} successfully reviewed ({req.status}).",
        "request": _supply_request_response(req)
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
