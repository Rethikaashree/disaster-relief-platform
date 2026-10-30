import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import HTTPException

from app.models import (
    Base,
    Beneficiary,
    DistributionCentre,
    ReliefDistribution,
    ReliefDistributionItem,
    SupplyAllocation,
    SupplyInventory,
    User,
)
from app.schemas import (
    DistributionHandoverRequest,
    DistributionItemHandover,
    DistributionConfirmRequest,
    DistributionItemConfirm,
)
from app.main import (
    handover_distribution,
    confirm_distribution_receipt,
    get_my_distributions,
    get_distribution_tracking_summary,
)


@pytest.fixture
def db_session():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def sample_data(db_session):
    officer = User(
        name="Officer Fast",
        email="officer.fast@example.com",
        phone="+919000000010",
        password_hash="fakehash",
        role="VERIFICATION_OFFICER",
        status="ACTIVE",
    )
    citizen = User(
        name="Citizen Fast",
        email="citizen.fast@example.com",
        phone="+919000000011",
        password_hash="fakehash",
        role="BENEFICIARY",
        status="ACTIVE",
    )
    other = User(
        name="Other Citizen",
        email="other.fast@example.com",
        phone="+919000000012",
        password_hash="fakehash",
        role="BENEFICIARY",
        status="ACTIVE",
    )
    db_session.add_all([officer, citizen, other])
    db_session.commit()

    centre = DistributionCentre(
        code="DC-FAST",
        name="Fast Relief Hub",
        district="Chennai",
        address="100 Marina St",
        contact_person="Director Fast",
        contact_phone="+919000000013",
        contact_email="fast@example.com",
        latitude=13.0,
        longitude=80.0,
    )
    db_session.add(centre)
    db_session.commit()

    inv = SupplyInventory(
        centre_id=centre.id,
        item_name="Emergency Food Kit",
        category="Food",
        unit="kits",
        quantity_available=100,
        quantity_reserved=0,
        quantity_allocated=0,
        quantity_delivered=0,
        storage_location="Bay 1",
        low_stock_threshold=10,
    )
    db_session.add(inv)
    db_session.commit()

    ben = Beneficiary(
        application_id="DR-FAST001",
        name="Citizen Fast",
        phone="+919000000011",
        address="123 Coastal Rd",
        district="Chennai",
        state="Tamil Nadu",
        family_size=4,
        verification_status="VERIFIED",
        allocation_status="ALLOCATED",
        delivery_status="PENDING",
        created_by_id=citizen.id,
    )
    db_session.add(ben)
    db_session.commit()

    alloc = SupplyAllocation(
        beneficiary_id=ben.id,
        centre_id=centre.id,
        inventory_id=inv.id,
        officer_id=officer.id,
        quantity_allocated=4,
        quantity_delivered=0,
        unit="kits",
        status="ALLOCATED",
        notes="Allocated 4 kits",
        allocated_at=datetime.now(timezone.utc),
    )
    db_session.add(alloc)
    db_session.commit()

    return {
        "officer": officer,
        "citizen": citizen,
        "other": other,
        "centre": centre,
        "inv": inv,
        "ben": ben,
        "alloc": alloc,
    }


def test_officer_handover_generates_ref_and_records_status(db_session, sample_data):
    req = DistributionHandoverRequest(
        beneficiary_id=sample_data["ben"].id,
        centre_id=sample_data["centre"].id,
        officer_notes="Handed over 4 kits",
        items=[
            DistributionItemHandover(
                allocation_id=sample_data["alloc"].id,
                quantity_distributed=4,
                notes="Good condition",
            )
        ],
    )
    res = handover_distribution(req, user=sample_data["officer"], db=db_session)
    dist = res["distribution"]
    assert dist.distribution_ref.startswith("DIST-")
    assert dist.status == "Distributed – Awaiting Beneficiary Confirmation"
    assert len(dist.items) == 1
    assert dist.items[0].quantity_distributed == 4
    assert dist.items[0].quantity_received is None


def test_beneficiary_confirms_all_received(db_session, sample_data):
    req = DistributionHandoverRequest(
        beneficiary_id=sample_data["ben"].id,
        items=[
            DistributionItemHandover(
                allocation_id=sample_data["alloc"].id,
                quantity_distributed=4,
            )
        ],
    )
    res = handover_distribution(req, user=sample_data["officer"], db=db_session)
    dist_id = res["distribution"].id

    confirm_req = DistributionConfirmRequest(
        action="CONFIRM_ALL",
        feedback="Everything received safely",
    )
    c_res = confirm_distribution_receipt(dist_id, confirm_req, user=sample_data["citizen"], db=db_session)
    confirmed_dist = c_res["distribution"]
    assert confirmed_dist.status == "Fully Received – Confirmed"
    assert confirmed_dist.items[0].quantity_received == 4
    assert confirmed_dist.items[0].quantity_missing == 0

    # Duplicate confirmation prevented
    with pytest.raises(HTTPException) as exc:
        confirm_distribution_receipt(dist_id, confirm_req, user=sample_data["citizen"], db=db_session)
    assert exc.value.status_code == 400
    assert "already been confirmed" in exc.value.detail


def test_unauthorized_beneficiary_blocked(db_session, sample_data):
    req = DistributionHandoverRequest(
        beneficiary_id=sample_data["ben"].id,
        items=[
            DistributionItemHandover(
                allocation_id=sample_data["alloc"].id,
                quantity_distributed=4,
            )
        ],
    )
    res = handover_distribution(req, user=sample_data["officer"], db=db_session)
    dist_id = res["distribution"].id

    confirm_req = DistributionConfirmRequest(action="CONFIRM_ALL")
    with pytest.raises(HTTPException) as exc:
        confirm_distribution_receipt(dist_id, confirm_req, user=sample_data["other"], db=db_session)
    assert exc.value.status_code == 403


def test_beneficiary_partial_receipt_tracking(db_session, sample_data):
    req = DistributionHandoverRequest(
        beneficiary_id=sample_data["ben"].id,
        items=[
            DistributionItemHandover(
                allocation_id=sample_data["alloc"].id,
                quantity_distributed=4,
            )
        ],
    )
    res = handover_distribution(req, user=sample_data["officer"], db=db_session)
    dist = res["distribution"]
    item_id = dist.items[0].id

    confirm_req = DistributionConfirmRequest(
        action="PARTIALLY_RECEIVED",
        feedback="Received 3 kits, 1 was missing",
        missing_items=[
            DistributionItemConfirm(
                item_id=item_id,
                quantity_received=3,
                quantity_missing=1,
                reason="One kit missing from truck",
            )
        ],
    )
    c_res = confirm_distribution_receipt(dist.id, confirm_req, user=sample_data["citizen"], db=db_session)
    updated = c_res["distribution"]
    assert updated.status == "Partially Received"
    assert updated.items[0].quantity_received == 3
    assert updated.items[0].quantity_missing == 1


def test_admin_tracking_summary_metrics(db_session, sample_data):
    summary = get_distribution_tracking_summary(user=sample_data["officer"], db=db_session)
    assert "total_beneficiaries_with_allocations" in summary
    assert "total_distributions_completed" in summary
    assert "beneficiaries_confirmed_receipt" in summary
    assert "pending_confirmations" in summary
    assert "partial_or_unsuccessful" in summary
    assert "reported_discrepancies" in summary
    assert "distributions" in summary
