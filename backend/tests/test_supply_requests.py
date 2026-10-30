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
    BeneficiarySupplyRequest,
    BeneficiarySupplyRequestItem,
)
from app.schemas import (
    SupplyInventoryCreate,
    SupplyInventoryUpdate,
    SupplyInventoryRestockRequest,
    SupplyRequestCreate,
    SupplyRequestItemInput,
    SupplyRequestReviewDecision,
    SupplyRequestItemReviewInput,
)
from app.main import (
    create_supply_inventory,
    update_supply_inventory,
    restock_supply_inventory,
    get_available_supplies,
    create_supply_request,
    get_my_supply_requests,
    get_all_supply_requests,
    review_supply_request,
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
        name="Officer Req",
        email="officer.req@example.com",
        phone="+919000000020",
        password_hash="fakehash",
        role="VERIFICATION_OFFICER",
        status="ACTIVE",
    )
    citizen = User(
        name="Citizen Req",
        email="citizen.req@example.com",
        phone="+919000000021",
        password_hash="fakehash",
        role="BENEFICIARY",
        status="ACTIVE",
    )
    db_session.add_all([officer, citizen])
    db_session.commit()

    centre = DistributionCentre(
        code="DC-REQ-1",
        name="Thanjavur Relief Depot",
        district="Thanjavur",
        address="55 Delta Road",
        contact_person="Depot Officer",
        contact_phone="+919000000022",
        contact_email="depot@example.com",
        latitude=10.78,
        longitude=79.13,
    )
    db_session.add(centre)
    db_session.commit()

    inv1 = SupplyInventory(
        centre_id=centre.id,
        item_name="Baby Food Pack",
        category="Baby Care",
        unit="packs",
        quantity_available=20,
        quantity_reserved=0,
        quantity_allocated=0,
        quantity_delivered=0,
        storage_location="Bin 1",
        low_stock_threshold=5,
        description="Nutritional formula for infants",
    )
    inv2 = SupplyInventory(
        centre_id=centre.id,
        item_name="Purified Water Can 20L",
        category="Water",
        unit="cans",
        quantity_available=15,
        quantity_reserved=0,
        quantity_allocated=0,
        quantity_delivered=0,
        storage_location="Bay 2",
        low_stock_threshold=5,
        description="20L sealed drinking water",
    )
    inv_zero = SupplyInventory(
        centre_id=centre.id,
        item_name="Mosquito Net",
        category="Shelter & Bedding",
        unit="pieces",
        quantity_available=0,
        quantity_reserved=0,
        quantity_allocated=0,
        quantity_delivered=0,
        storage_location="Shelf 3",
        low_stock_threshold=5,
        description="Out of stock net",
    )
    db_session.add_all([inv1, inv2, inv_zero])
    db_session.commit()

    ben = Beneficiary(
        application_id="DR-REQ001",
        name="Citizen Req",
        phone="+919000000021",
        address="10 River Side",
        district="Thanjavur",
        state="Tamil Nadu",
        family_size=4,
        verification_status="VERIFIED",
        allocation_status="UNALLOCATED",
        delivery_status="PENDING",
        created_by_id=citizen.id,
    )
    db_session.add(ben)
    db_session.commit()

    return {
        "officer": officer,
        "citizen": citizen,
        "centre": centre,
        "inv1": inv1,
        "inv2": inv2,
        "inv_zero": inv_zero,
        "ben": ben,
    }


def test_officer_inventory_crud_and_restock(db_session, sample_data):
    officer = sample_data["officer"]
    centre = sample_data["centre"]

    # 1. Create new inventory item
    create_req = SupplyInventoryCreate(
        centre_id=centre.id,
        item_name="First Aid Kit Standard",
        category="Medical",
        unit="kits",
        quantity_available=30,
        low_stock_threshold=5,
        storage_location="Med Box 1",
        description="Essential bandages and antiseptic",
    )
    new_inv = create_supply_inventory(create_req, user=officer, db=db_session)
    assert new_inv.item_name == "First Aid Kit Standard"
    assert new_inv.quantity_available == 30
    assert new_inv.description == "Essential bandages and antiseptic"

    # 2. Update inventory item details
    update_req = SupplyInventoryUpdate(
        description="Updated essential medical kit with burns dressing",
        storage_location="Med Cabinet A",
    )
    updated = update_supply_inventory(new_inv.id, update_req, user=officer, db=db_session)
    assert updated.storage_location == "Med Cabinet A"
    assert "burns dressing" in (updated.description or "")

    # 3. Restock inventory item
    restock_req = SupplyInventoryRestockRequest(
        quantity_added=20,
        source_notes="New donation shipment from Red Cross",
    )
    restock_res = restock_supply_inventory(new_inv.id, restock_req, user=officer, db=db_session)
    assert restock_res["inventory"].quantity_available == 50


def test_available_supplies_excludes_zero_stock(db_session, sample_data):
    citizen = sample_data["citizen"]
    res = get_available_supplies(user=citizen, db=db_session)
    items = res["items"]
    assert len(items) == 2  # inv1 and inv2, but NOT inv_zero
    for item in items:
        assert item.quantity_available > 0
        assert item.item_name != "Mosquito Net"


def test_beneficiary_request_submission_and_officer_review_lifecycle(db_session, sample_data):
    officer = sample_data["officer"]
    citizen = sample_data["citizen"]
    ben = sample_data["ben"]
    inv1 = sample_data["inv1"]
    inv2 = sample_data["inv2"]

    # 1. Beneficiary submits request for 2 items
    req_payload = SupplyRequestCreate(
        beneficiary_id=ben.id,
        notes="Urgent baby formula and water needed for infant",
        items=[
            SupplyRequestItemInput(inventory_id=inv1.id, quantity_requested=6),
            SupplyRequestItemInput(inventory_id=inv2.id, quantity_requested=4),
        ],
    )
    created_res = create_supply_request(req_payload, user=citizen, db=db_session)
    req_obj = created_res["request"]
    assert req_obj.request_ref.startswith("REQ-")
    assert req_obj.status == "PENDING"
    assert len(req_obj.items) == 2

    # Beneficiary checks my requests
    my_requests = get_my_supply_requests(user=citizen, db=db_session)
    assert my_requests["total"] == 1
    assert my_requests["items"][0].status == "PENDING"

    # 2. Officer reviews the request:
    # Item 1 (Baby Food Pack): Approve full 6
    # Item 2 (Water Can): Partially approve 2 (due to camp water rationing) with reason
    item1_id = req_obj.items[0].id
    item2_id = req_obj.items[1].id

    review_decision = SupplyRequestReviewDecision(
        officer_remarks="Verified flood area, approved critical supplies.",
        items=[
            SupplyRequestItemReviewInput(
                item_id=item1_id,
                action="APPROVE_FULL",
            ),
            SupplyRequestItemReviewInput(
                item_id=item2_id,
                action="APPROVE_PARTIAL",
                quantity_approved=2,
                reason="Conserving water cans for pending families",
            ),
        ],
    )

    review_res = review_supply_request(req_obj.id, review_decision, user=officer, db=db_session)
    reviewed_req = review_res["request"]

    # Check status and quantities
    assert reviewed_req.status == "PARTIALLY_APPROVED"
    assert reviewed_req.items[0].status == "APPROVED"
    assert reviewed_req.items[0].quantity_approved == 6
    assert reviewed_req.items[1].status == "PARTIALLY_APPROVED"
    assert reviewed_req.items[1].quantity_approved == 2
    assert "Conserving water cans" in (reviewed_req.items[1].decision_reason or "")

    # Check stock deduction
    db_session.refresh(inv1)
    db_session.refresh(inv2)
    assert inv1.quantity_available == 20 - 6  # 14
    assert inv1.quantity_allocated == 6
    assert inv2.quantity_available == 15 - 2  # 13
    assert inv2.quantity_allocated == 2

    # Check allocations created for beneficiary
    allocs = db_session.query(SupplyAllocation).filter_by(beneficiary_id=ben.id).all()
    assert len(allocs) == 2
    assert sum(a.quantity_allocated for a in allocs) == 8


def test_insufficient_stock_rejection(db_session, sample_data):
    officer = sample_data["officer"]
    citizen = sample_data["citizen"]
    ben = sample_data["ben"]
    inv1 = sample_data["inv1"]  # 20 available

    req_payload = SupplyRequestCreate(
        beneficiary_id=ben.id,
        items=[SupplyRequestItemInput(inventory_id=inv1.id, quantity_requested=50)],
    )
    created_res = create_supply_request(req_payload, user=citizen, db=db_session)
    req_obj = created_res["request"]
    item_id = req_obj.items[0].id

    # Trying to approve 50 when only 20 in stock
    decision = SupplyRequestReviewDecision(
        items=[
            SupplyRequestItemReviewInput(
                item_id=item_id,
                action="APPROVE_FULL",
            )
        ]
    )
    with pytest.raises(HTTPException) as exc:
        review_supply_request(req_obj.id, decision, user=officer, db=db_session)
    assert exc.value.status_code == 400
    assert "Insufficient stock" in exc.value.detail
