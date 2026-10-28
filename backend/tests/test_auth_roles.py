import hashlib
from io import BytesIO
from uuid import uuid4

from fastapi.testclient import TestClient
from PIL import Image
import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import database
from app.database import get_db
from app.main import app
from app.models import AuditLog, Base, BeneficiaryDuplicate, User
from app.security import hash_password, verify_password
from app.config import Settings, settings

test_engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    with TestSessionLocal() as db:
        yield db


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def unique_email(prefix: str) -> str:
    return f"{prefix}{uuid4().hex[:8]}@example.com"


def beneficiary_payload(email: str) -> dict:
    suffix = email.split("@", 1)[0][-8:]
    return {
        "name": f"Test Beneficiary {suffix}",
        "email": email,
        "phone": f"9{int(suffix, 16) % 1_000_000_000:09d}",
        "password": "Secret123!",
        "confirm_password": "Secret123!",
        "address": "Test street 10",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "pincode": "226001",
    }


def login_token(email: str) -> str:
    response = client.post("/api/auth/login", json={"email": email, "password": "Secret123!"})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_database_schema_migration_adds_missing_user_columns(tmp_path, monkeypatch):
    legacy_engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}", connect_args={"check_same_thread": False})
    with legacy_engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, "
            "password_hash TEXT NOT NULL, role TEXT NOT NULL)"
        ))
    monkeypatch.setattr(database, "engine", legacy_engine)
    database.ensure_database_schema()
    with legacy_engine.begin() as conn:
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()}
    assert "status" in columns
    assert "updated_at" in columns


def test_demo_accounts_can_login_for_all_three_portals():
    demo_accounts = [
        {"email": "beneficiary@example.com", "password": "ExamplePass123!", "role": "BENEFICIARY"},
        {"email": "donor@example.com", "password": "ExamplePass123!", "role": "DONOR"},
        {"email": "officer@example.com", "password": "ExamplePass123!", "role": "VERIFICATION_OFFICER"},
    ]
    for account in demo_accounts:
        response = client.post(
            "/api/auth/login",
            json={"email": account["email"], "password": account["password"]},
        )
        assert response.status_code == 200, response.text
        assert response.json()["user"]["role"] == account["role"]


def test_production_settings_reject_placeholder_secret():
    with pytest.raises(ValueError):
        Settings(environment="production", secret_key="replace-with-a-long-random-secret")
    Settings(environment="production", secret_key="a-unique-production-secret-at-least-32-chars")


def test_password_hashing_uses_salts_and_accepts_legacy_hashes():
    first_hash = hash_password("SecurePassword123!")
    second_hash = hash_password("SecurePassword123!")
    assert first_hash != second_hash
    assert verify_password("SecurePassword123!", first_hash)
    legacy_hash = hashlib.pbkdf2_hmac(
        "sha256",
        b"LegacyPassword123!",
        settings.secret_key.encode("utf-8"),
        200_000,
    ).hex()
    assert verify_password("LegacyPassword123!", legacy_hash)


def test_beneficiary_register_and_login():
    email = unique_email("beneficiary")
    reg = client.post(
        "/api/auth/beneficiary/register",
        json={
            "name": "Test Beneficiary",
            "email": email,
            "phone": "9876543210",
            "password": "Secret123!",
            "confirm_password": "Secret123!",
            "address": "Test street 10",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226001",
        },
    )
    assert reg.status_code == 201, reg.text
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Secret123!"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["user"]["role"] == "BENEFICIARY"


def test_donor_register_and_login():
    email = unique_email("donor")
    reg = client.post(
        "/api/auth/donor/register",
        json={
            "name": "Test Donor",
            "email": email,
            "phone": "9123456789",
            "password": "Secret123!",
            "confirm_password": "Secret123!",
        },
    )
    assert reg.status_code == 201, reg.text
    login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Secret123!"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["user"]["role"] == "DONOR"
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    overview = client.get("/api/donor/overview", headers=headers)
    assert overview.status_code == 200, overview.text
    assert "registered_beneficiaries" in overview.json()
    assert "verified_beneficiaries" in overview.json()
    assert "phone" not in overview.json()
    pledge = client.post(
        "/api/donor/pledges",
        json={"amount": "1000 INR", "campaign": "Flood response", "message": "Donation interest"},
        headers=headers,
    )
    assert pledge.status_code == 200, pledge.text
    assert "not a completed payment" in pledge.json()["message"]
    history = client.get("/api/donor/pledges", headers=headers)
    assert history.status_code == 200
    assert history.json()["items"][0]["campaign"] == "Flood response"
    notifications = client.get("/api/notifications", headers=headers)
    assert notifications.status_code == 200
    assert notifications.json()["unread"] >= 2
    notification_id = notifications.json()["items"][0]["id"]
    other_email = unique_email("otherdonor")
    client.post("/api/auth/donor/register", json={
        "name": "Other Test Donor",
        "email": other_email,
        "password": "Secret123!",
        "confirm_password": "Secret123!",
    })
    other_token = login_token(other_email)
    assert client.patch(
        f"/api/notifications/{notification_id}/read",
        headers={"Authorization": f"Bearer {other_token}"},
    ).status_code == 404


def test_public_officer_registration_route_is_not_available():
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Unauthorized Officer",
            "email": unique_email("publicofficer"),
            "password": "Secret123!",
            "role": "verification_officer",
        },
    )
    assert response.status_code == 404, response.text


def test_beneficiary_application_is_private_and_requires_officer_review(tmp_path, monkeypatch):
    monkeypatch.setattr("app.main.settings.upload_dir", str(tmp_path))
    image = BytesIO()
    Image.new("RGB", (24, 24), "white").save(image, format="PNG")
    image_content = image.getvalue()
    owner_email = unique_email("owner")
    other_email = unique_email("other")
    owner_profile = beneficiary_payload(owner_email)
    client.post("/api/auth/beneficiary/register", json=owner_profile)
    client.post("/api/auth/beneficiary/register", json=beneficiary_payload(other_email))
    owner_token = login_token(owner_email)
    other_token = login_token(other_email)
    application = client.post(
        "/api/beneficiaries",
        json={
            "name": owner_profile["name"],
            "phone": owner_profile["phone"],
            "address": "Test street 10",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226001",
            "disaster_type": "Flood",
            "affected_location": "River Ward",
            "family_size": 4,
            "number_of_dependents": 2,
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert application.status_code == 201, application.text
    beneficiary = application.json()["beneficiary"]
    assert beneficiary["verification_status"] == "DRAFT"
    beneficiary_id = beneficiary["id"]

    own_record = client.get(f"/api/beneficiaries/{beneficiary_id}", headers={"Authorization": f"Bearer {owner_token}"})
    assert own_record.status_code == 200
    invalid_upload = client.post(
        f"/api/aadhaar/upload?beneficiary_id={beneficiary_id}",
        files={"file": ("identity.png", b"not-an-image", "image/png")},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert invalid_upload.status_code == 400
    upload = client.post(
        f"/api/aadhaar/upload?beneficiary_id={beneficiary_id}",
        files={"file": ("identity.png", image_content, "image/png")},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert upload.status_code == 200, upload.text
    with TestSessionLocal() as db:
        upload_audit = db.scalar(select(AuditLog).where(AuditLog.action == "AADHAAR_UPLOADED", AuditLog.entity_id == str(upload.json()["document_id"])))
    assert upload_audit is not None
    submitted = client.post(f"/api/beneficiaries/{beneficiary_id}/submit", headers={"Authorization": f"Bearer {owner_token}"})
    assert submitted.status_code == 200, submitted.text
    assert submitted.json()["status"] == "PENDING"
    blocked_reupload = client.post(
        f"/api/aadhaar/upload?beneficiary_id={beneficiary_id}",
        files={"file": ("identity.png", image_content, "image/png")},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert blocked_reupload.status_code == 403
    duplicate_application = client.post(
        "/api/beneficiaries",
        json={
            "name": owner_profile["name"],
            "phone": owner_profile["phone"],
            "address": owner_profile["address"],
            "district": owner_profile["district"],
            "state": owner_profile["state"],
            "pincode": owner_profile["pincode"],
            "disaster_type": "Flood",
            "affected_location": "River Ward",
            "family_size": 4,
            "number_of_dependents": 2,
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert duplicate_application.status_code == 201
    duplicate_id = duplicate_application.json()["beneficiary"]["id"]
    duplicate_upload = client.post(
        f"/api/aadhaar/upload?beneficiary_id={duplicate_id}",
        files={"file": ("identity.png", image_content, "image/png")},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert duplicate_upload.status_code == 200
    duplicate_submission = client.post(f"/api/beneficiaries/{duplicate_id}/submit", headers={"Authorization": f"Bearer {owner_token}"})
    assert duplicate_submission.status_code == 200
    assert duplicate_submission.json()["status"] == "DUPLICATE_FLAGGED"
    with TestSessionLocal() as db:
        duplicate_record = db.scalar(select(BeneficiaryDuplicate).where(BeneficiaryDuplicate.beneficiary_id == duplicate_id))
    assert duplicate_record is not None
    tracked = client.get("/api/beneficiaries/my-applications", headers={"Authorization": f"Bearer {owner_token}"})
    statuses = {item["id"]: item["verification_status"] for item in tracked.json()["items"]}
    assert statuses[beneficiary_id] == "PENDING"
    assert statuses[duplicate_id] == "DUPLICATE_FLAGGED"
    private_record = client.get(f"/api/beneficiaries/{beneficiary_id}", headers={"Authorization": f"Bearer {other_token}"})
    assert private_record.status_code == 403
    decision = client.post(
        f"/api/beneficiaries/{beneficiary_id}/verify",
        json={"new_status": "VERIFIED", "remarks": "Self approval"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert decision.status_code == 403
    reviewer_email = unique_email("reviewer")
    reviewer_password = "ReviewOfficer123!"
    with TestSessionLocal() as db:
        db.add(User(
            name="Authorized Reviewer",
            email=reviewer_email,
            password_hash=hash_password(reviewer_password),
            role="VERIFICATION_OFFICER",
            status="ACTIVE",
        ))
        db.commit()
    reviewer_login = client.post("/api/auth/login", json={"email": reviewer_email, "password": reviewer_password})
    reviewer_headers = {"Authorization": f"Bearer {reviewer_login.json()['access_token']}"}
    draft_application = client.post(
        "/api/beneficiaries",
        json={
            "name": "Unsubmitted Draft",
            "phone": "9000000001",
            "address": "Separate draft address",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226001",
            "disaster_type": "Flood",
            "affected_location": "River Ward",
            "family_size": 1,
            "number_of_dependents": 0,
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    draft_id = draft_application.json()["beneficiary"]["id"]
    assert client.post(
        f"/api/beneficiaries/{draft_id}/reject",
        json={"new_status": "REJECTED", "remarks": "Draft must not be rejected"},
        headers=reviewer_headers,
    ).status_code == 409
    assert client.post(
        f"/api/beneficiaries/{draft_id}/flag-duplicate",
        json={"new_status": "DUPLICATE_FLAGGED", "remarks": "Draft must not be flagged"},
        headers=reviewer_headers,
    ).status_code == 409
    verified = client.post(
        f"/api/beneficiaries/{beneficiary_id}/verify",
        json={"new_status": "VERIFIED", "remarks": "Identity and disaster details reviewed"},
        headers=reviewer_headers,
    )
    assert verified.status_code == 200, verified.text
    updated_application = client.get("/api/beneficiaries/my-applications", headers={"Authorization": f"Bearer {owner_token}"})
    own_status = next(item for item in updated_application.json()["items"] if item["id"] == beneficiary_id)
    assert own_status["verification_status"] == "VERIFIED"
    assert own_status["verification_remarks"] == "Identity and disaster details reviewed"


def test_logout_revokes_current_token():
    email = unique_email("logout")
    client.post("/api/auth/beneficiary/register", json=beneficiary_payload(email))
    token = login_token(email)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/auth/logout", headers=headers).status_code == 200
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_officer_creation_restricted_to_main_admin():
    admin_email = unique_email("mainadmin")
    admin_password = "AdminTest123!"
    with TestSessionLocal() as db:
        db.add(User(
            name="Test Main Admin",
            email=admin_email,
            password_hash=hash_password(admin_password),
            role="MAIN_ADMIN",
            status="ACTIVE",
        ))
        db.commit()
    admin_login = client.post(
        "/api/auth/login",
        json={"email": admin_email, "password": admin_password},
    )
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    officer_email = unique_email("officer")
    ok = client.post(
        "/api/admin/officers",
        json={
            "name": "Created Officer",
            "email": officer_email,
            "password": "OfficerTemp123!",
            "confirm_password": "OfficerTemp123!",
        },
        headers=admin_headers,
    )
    assert ok.status_code == 201, ok.text
    assert ok.json()["user"]["must_change_password"] is True
    duplicate = client.post(
        "/api/admin/officers",
        json={
            "name": "Duplicate Officer",
            "email": officer_email,
            "password": "OfficerTemp123!",
            "confirm_password": "OfficerTemp123!",
        },
        headers=admin_headers,
    )
    assert duplicate.status_code == 409
    officer_login = client.post(
        "/api/auth/login",
        json={"email": officer_email, "password": "OfficerTemp123!"},
    )
    officer_token = officer_login.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}
    assert client.get("/api/dashboard/statistics", headers=officer_headers).status_code == 403
    assert client.get("/api/admin/officers", headers=officer_headers).status_code == 403
    changed = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "OfficerTemp123!",
            "password": "OfficerChanged123!",
            "confirm_password": "OfficerChanged123!",
        },
        headers=officer_headers,
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["user"]["must_change_password"] is False
    new_headers = {"Authorization": f"Bearer {changed.json()['access_token']}"}
    assert client.get("/api/dashboard/statistics", headers=new_headers).status_code == 200
    reset = client.patch(
        f"/api/admin/officers/{ok.json()['user']['id']}/password",
        json={"password": "OfficerReset123!", "confirm_password": "OfficerReset123!"},
        headers=admin_headers,
    )
    assert reset.status_code == 200, reset.text
    reset_login = client.post("/api/auth/login", json={"email": officer_email, "password": "OfficerReset123!"})
    assert reset_login.status_code == 200
    assert client.get("/api/dashboard/statistics", headers={"Authorization": f"Bearer {reset_login.json()['access_token']}"}).status_code == 403
    deactivated = client.patch(
        f"/api/admin/officers/{ok.json()['user']['id']}/status",
        json={"status": "INACTIVE"},
        headers=admin_headers,
    )
    assert deactivated.status_code == 200
    assert client.post("/api/auth/login", json={"email": officer_email, "password": "OfficerReset123!"}).status_code == 403

    email = unique_email("nonadmin")
    user = client.post(
        "/api/auth/beneficiary/register",
        json={
            "name": "Non Admin",
            "email": email,
            "phone": "9999999999",
            "password": "Secret123!",
            "confirm_password": "Secret123!",
            "address": "Test street 10",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226001",
        },
    )
    assert user.status_code == 201, user.text
    token = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Secret123!"},
    ).json()["access_token"]

    response = client.post(
        "/api/admin/officers",
        json={
            "name": "Bad Officer",
            "email": unique_email("bad"),
            "password": "OfficerValid123!",
            "confirm_password": "OfficerValid123!",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, response.text
