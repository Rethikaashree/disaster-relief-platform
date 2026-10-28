import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models import Base, DistributionCentre, SupplyInventory, Beneficiary, ReliefRequestItem, SupplyAllocation, User
from app.security import hash_password, create_access_token
from seed_dummy_data import seed_distribution_centres_and_inventory, seed_beneficiaries_and_requests

test_engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

def override_get_db():
    with TestSessionLocal() as db:
        yield db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_and_override_db():
    prev = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    with TestSessionLocal() as db:
        # Check if already seeded in this in-memory test db
        if not db.query(DistributionCentre).first():
            officer = User(
                name='Test Officer',
                email='test.officer@example.com',
                phone='+919000000000',
                password_hash=hash_password('ExamplePass123!'),
                role='VERIFICATION_OFFICER',
                status='ACTIVE'
            )
            beneficiary_user = User(
                name='Test Beneficiary User',
                email='test.ben@example.com',
                phone='+919000000001',
                password_hash=hash_password('ExamplePass123!'),
                role='BENEFICIARY',
                status='ACTIVE'
            )
            db.add_all([officer, beneficiary_user])
            db.commit()
            db.refresh(officer)
            db.refresh(beneficiary_user)

            centres = seed_distribution_centres_and_inventory(db)
            seed_beneficiaries_and_requests(db, [officer], centres)
    yield
    if prev is not None:
        app.dependency_overrides[get_db] = prev
    else:
        app.dependency_overrides.pop(get_db, None)

def officer_auth():
    with TestSessionLocal() as db:
        officer = db.query(User).filter_by(role='VERIFICATION_OFFICER').first()
        token = create_access_token(officer)
        return {'Authorization': f'Bearer {token}'}

def test_distribution_centres_exist_and_listed():
    resp = client.get('/api/distribution/centres')
    assert resp.status_code == 200
    data = resp.json()
    assert data['total'] >= 10
    districts = {c['district'] for c in data['items']}
    for req_d in ['Chennai', 'Cuddalore', 'Villupuram', 'Nagapattinam', 'Thanjavur', 'Tiruvallur', 'Chengalpattu', 'Tirunelveli', 'Thoothukudi', 'Mayiladuthurai']:
        assert req_d in districts

def test_inventory_filters_and_stock_status():
    resp = client.get('/api/distribution/inventory?district=Chennai')
    assert resp.status_code == 200
    items = resp.json()['items']
    assert len(items) >= 15
    for item in items:
        assert item['stock_status'] in ['In Stock', 'Low Stock', 'Out of Stock']

def test_non_verified_beneficiary_allocation_rejected():
    with TestSessionLocal() as db:
        unverified = db.query(Beneficiary).filter(Beneficiary.verification_status != 'VERIFIED').first()
        centre = db.query(DistributionCentre).first()
        inv = db.query(SupplyInventory).filter(SupplyInventory.centre_id == centre.id, SupplyInventory.quantity_available > 5).first()
        ben_id = unverified.id
        inv_id = inv.id
        centre_id = centre.id

    headers = officer_auth()
    resp = client.post(
        f'/api/beneficiaries/{ben_id}/allocate',
        headers=headers,
        json={
            'centre_id': centre_id,
            'allocations': [{'inventory_id': inv_id, 'quantity': 1}]
        }
    )
    assert resp.status_code == 400
    assert 'verified' in resp.json()['detail'].lower()

def test_overspending_inventory_rejected():
    with TestSessionLocal() as db:
        verified = db.query(Beneficiary).filter(Beneficiary.verification_status == 'VERIFIED').first()
        centre = db.query(DistributionCentre).first()
        inv = db.query(SupplyInventory).filter(SupplyInventory.centre_id == centre.id).first()
        ben_id = verified.id
        inv_id = inv.id
        centre_id = centre.id
        excess_qty = inv.quantity_available + 500

    headers = officer_auth()
    resp = client.post(
        f'/api/beneficiaries/{ben_id}/allocate',
        headers=headers,
        json={
            'centre_id': centre_id,
            'allocations': [{'inventory_id': inv_id, 'quantity': excess_qty}]
        }
    )
    assert resp.status_code == 400
    assert 'insufficient' in resp.json()['detail'].lower()

def test_successful_allocation_and_delivery_flow():
    with TestSessionLocal() as db:
        verified = db.query(Beneficiary).filter(Beneficiary.verification_status == 'VERIFIED').first()
        centre = db.query(DistributionCentre).first()
        inv = db.query(SupplyInventory).filter(SupplyInventory.centre_id == centre.id, SupplyInventory.quantity_available >= 5).first()
        ben_id = verified.id
        inv_id = inv.id
        centre_id = centre.id
        initial_avail = inv.quantity_available
        initial_alloc = inv.quantity_allocated

    headers = officer_auth()
    # 1. Allocate
    resp = client.post(
        f'/api/beneficiaries/{ben_id}/allocate',
        headers=headers,
        json={
            'centre_id': centre_id,
            'allocations': [{'inventory_id': inv_id, 'quantity': 2}]
        }
    )
    assert resp.status_code == 200
    alloc_id = resp.json()['allocations'][0]['id']

    # Verify stock decremented
    with TestSessionLocal() as db:
        inv_after = db.get(SupplyInventory, inv_id)
        assert inv_after.quantity_available == initial_avail - 2
        assert inv_after.quantity_allocated == initial_alloc + 2

    # 2. Dispatch
    disp_resp = client.post(f'/api/allocations/{alloc_id}/dispatch', headers=headers)
    assert disp_resp.status_code == 200
    assert disp_resp.json()['status'] == 'DISPATCHED'

    # 3. Deliver
    deliv_resp = client.post(f'/api/allocations/{alloc_id}/deliver', headers=headers)
    assert deliv_resp.status_code == 200

    # 4. Check allocations list
    allocs_resp = client.get(f'/api/beneficiaries/{ben_id}/allocations', headers=headers)
    assert allocs_resp.status_code == 200
    assert any(a['id'] == alloc_id and a['status'] == 'DELIVERED' for a in allocs_resp.json()['items'])
