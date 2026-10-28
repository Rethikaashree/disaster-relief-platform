from __future__ import annotations

import hashlib
import random
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import (
    AuditLog,
    Beneficiary,
    DistributionCentre,
    DonationPledge,
    Notification,
    ReliefRequestItem,
    SupplyAllocation,
    SupplyInventory,
    User,
    VerificationRecord,
)
from app.security import hash_password


BASE_DIR = Path(__file__).resolve().parent
REPORT_PATH = BASE_DIR / "dev_seed_credentials.md"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def synthetic_aadhaar(seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return f"{digest[:4]} {digest[4:8]} {digest[8:12]}"


def ensure_dev_mode() -> None:
    if settings.environment.lower() == "production":
        raise RuntimeError("Seeding is disabled in production mode.")


DEMO_PASSWORD = "DemoPass123!"
DEMO_TAG = "SYNTHETIC DEMO DATA"


def ensure_main_admin(db) -> User:
    main_email = (settings.main_admin_email or "demo.admin@example.dev").strip().lower()
    main_password = settings.main_admin_password or DEMO_PASSWORD
    admin = db.scalar(select(User).where(User.email == main_email))
    if admin is None:
        admin = User(
            name="Main Admin Officer",
            email=main_email,
            phone="+910000000000",
            password_hash=hash_password(main_password),
            role="MAIN_ADMIN",
            status="ACTIVE",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    return admin


def ensure_officers(db, admin: User) -> list[User]:
    officer_specs = [
        ("Meera Krishnamurthy", "officer.meera@example.dev"),
        ("Sathish Raman", "officer.sathish@example.dev"),
        ("Priya Elango", "officer.priya@example.dev"),
        ("Farhan Ali", "officer.farhan@example.dev"),
    ]
    officers: list[User] = []
    for name, email in officer_specs:
        officer = db.scalar(select(User).where(User.email == email))
        if officer is None:
            officer = User(
                name=name,
                email=email,
                phone="+910000000000",
                password_hash=hash_password(DEMO_PASSWORD),
                role="VERIFICATION_OFFICER",
                status="ACTIVE",
                must_change_password=False,
            )
            db.add(officer)
            db.flush()
            db.add(
                AuditLog(
                    user_id=admin.id,
                    action="OFFICER_CREATED",
                    entity_type="USER",
                    entity_id=email,
                    remarks=f"{DEMO_TAG}: officer account seeded for local demonstration.",
                )
            )
        officers.append(officer)
    db.commit()
    return officers


def existing_officers(db, fallback_admin: User) -> list[User]:
    officers = db.scalars(
        select(User).where(User.role == "VERIFICATION_OFFICER").order_by(User.id)
    ).all()
    return list(officers) or [fallback_admin]


def ensure_donors(db) -> list[User]:
    donor_specs = [
        ("Anand Sivasamy", "donor.anand@example.dev", "Chennai"),
        ("Lakshmi Narayanan", "donor.lakshmi@example.dev", "Cuddalore"),
        ("Vikram Selvan", "donor.vikram@example.dev", "Nagapattinam"),
        ("Nisha Balakrishnan", "donor.nisha@example.dev", "Tiruvallur"),
        ("Arun Karthik", "donor.arun@example.dev", "Thanjavur"),
        ("Deepa Mohan", "donor.deepa@example.dev", "Madurai"),
        ("Karthik Prasad", "donor.karthik@example.dev", "Coimbatore"),
        ("Rekha Shankar", "donor.rekha@example.dev", "Mayiladuthurai"),
        ("Sanjay Varma", "donor.sanjay@example.dev", "Villupuram"),
        ("Divya Velu", "donor.divya@example.dev", "Kancheepuram"),
        ("Harini Raj", "donor.harini@example.dev", "Tirunelveli"),
        ("Manoj Senthil", "donor.manoj@example.dev", "Kanyakumari"),
        ("Revathi Iyer", "donor.revathi@example.dev", "Salem"),
        ("Rohit Narain", "donor.rohit@example.dev", "Erode"),
        ("Gayathri Mohan", "donor.gayathri@example.dev", "Trichy"),
        ("Srinivas Balaji", "donor.srinivas@example.dev", "Dindigul"),
        ("Janani Prakash", "donor.janani@example.dev", "Chengalpattu"),
        ("Vasanth Kumar", "donor.vasanth@example.dev", "Ramanathapuram"),
        ("Leela Subramaniam", "donor.leela@example.dev", "Pudukkottai"),
        ("Aditya Vel", "donor.aditya@example.dev", "Thoothukudi"),
    ]
    created: list[User] = []
    for index, (name, email, district) in enumerate(donor_specs):
        donor = db.scalar(select(User).where(User.email == email.lower()))
        if donor is None:
            donor = User(
                name=name,
                email=email.lower(),
                phone=f"+9199{index:08d}",
                address=f"{24 + index}, Demo Relief Supply Street, {district}",
                district=district,
                state="Tamil Nadu",
                pincode=str(600000 + index),
                password_hash=hash_password(DEMO_PASSWORD),
                role="DONOR",
                status="ACTIVE",
            )
            db.add(donor)
            db.commit()
            db.refresh(donor)
        created.append(donor)
    return created


def seed_donor_pledges(db, donors: list[User]) -> int:
    resources = [
        ("Food kits", "350 kits", "READY"),
        ("Drinking water", "1200 litres", "READY"),
        ("Clothing", "220 family packs", "PENDING_PICKUP"),
        ("Medicine", "80 first-aid kits", "READY"),
        ("Shelter supplies", "65 tarpaulin sets", "ALLOCATED"),
        ("Sanitation", "140 hygiene kits", "READY"),
    ]
    count = 0
    for index, donor in enumerate(donors):
        # Seed 2 to 3 resource categories per donor
        slice_end = 2 + (index % 3)
        for offset, (campaign, amount, status) in enumerate(resources[:slice_end]):
            existing = db.scalar(
                select(DonationPledge).where(
                    DonationPledge.donor_id == donor.id,
                    DonationPledge.campaign == campaign,
                )
            )
            if existing:
                continue
            pledge = DonationPledge(
                donor_id=donor.id,
                amount=amount,
                campaign=campaign,
                message=(
                    f"{DEMO_TAG}: {status}; available near {donor.district}; "
                    f"demo coordinates {12.80 + (index * 0.05):.4f}, {79.90 + (offset * 0.08):.4f}."
                ),
                created_at=utc_now() - timedelta(days=index + offset * 3 + 1),
            )
            db.add(pledge)
            count += 1
    db.commit()
    return count


# ==============================================================================
# DISTRIBUTION CENTRES & SUPPLY INVENTORY SEEDING
# ==============================================================================

DISTRIBUTION_CENTRE_SPECS = [
    {
        "code": "DC-CHN-01",
        "name": "Chennai Central Relief Logistics Hub",
        "district": "Chennai",
        "address": "12, EVR Periyar Salai, Park Town, Chennai 600003",
        "contact_person": "K. Sundaravel (Logistics Officer)",
        "contact_phone": "+91-44-25381122",
        "contact_email": "chennai.relief.hub@tn.disaster.demo",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "map_x": 72.0,
        "map_y": 18.0,
    },
    {
        "code": "DC-CUD-01",
        "name": "Cuddalore Coastal Emergency Depot",
        "district": "Cuddalore",
        "address": "Block 4, Harbor Warehousing Complex, Cuddalore Port 607003",
        "contact_person": "M. Jayakumar (Centre In-Charge)",
        "contact_phone": "+91-4142-234501",
        "contact_email": "cuddalore.depot@tn.disaster.demo",
        "latitude": 11.7480,
        "longitude": 79.7714,
        "map_x": 68.0,
        "map_y": 38.0,
    },
    {
        "code": "DC-VLP-01",
        "name": "Villupuram Regional Aid Warehouse",
        "district": "Villupuram",
        "address": "NH-45 Bypass Service Road, Thirukovilur Block, Villupuram 605602",
        "contact_person": "R. Selvaraj (Storage Supervisor)",
        "contact_phone": "+91-4146-228910",
        "contact_email": "villupuram.warehouse@tn.disaster.demo",
        "latitude": 11.9401,
        "longitude": 79.4861,
        "map_x": 58.0,
        "map_y": 32.0,
    },
    {
        "code": "DC-NGP-01",
        "name": "Nagapattinam Delta Disaster Center",
        "district": "Nagapattinam",
        "address": "Collectorate Grounds, Coastal Highway, Nagapattinam 611001",
        "contact_person": "V. Anandhi (Relief Coordinator)",
        "contact_phone": "+91-4365-242311",
        "contact_email": "nagai.relief@tn.disaster.demo",
        "latitude": 10.7672,
        "longitude": 79.8449,
        "map_x": 74.0,
        "map_y": 52.0,
    },
    {
        "code": "DC-TNJ-01",
        "name": "Thanjavur Agricultural Relief Depot",
        "district": "Thanjavur",
        "address": "Kaveri Basin Food Grain Storage, Old Bus Terminal, Thanjavur 613001",
        "contact_person": "S. Murugesan (Supply In-Charge)",
        "contact_phone": "+91-4362-278100",
        "contact_email": "thanjavur.depot@tn.disaster.demo",
        "latitude": 10.7870,
        "longitude": 79.1378,
        "map_x": 60.0,
        "map_y": 48.0,
    },
    {
        "code": "DC-TVL-01",
        "name": "Tiruvallur Flood Relief Point",
        "district": "Tiruvallur",
        "address": "Railway Station West Relief Yard, Tiruvallur 602001",
        "contact_person": "P. Karthikeyan (Distribution Head)",
        "contact_phone": "+91-44-27660245",
        "contact_email": "tiruvallur.aid@tn.disaster.demo",
        "latitude": 13.1432,
        "longitude": 79.9074,
        "map_x": 67.0,
        "map_y": 13.0,
    },
    {
        "code": "DC-CGP-01",
        "name": "Chengalpattu Suburban Supply Station",
        "district": "Chengalpattu",
        "address": "GST Road Warehouse Sector 2, Chengalpattu 603001",
        "contact_person": "T. Bhavani (Logistics Lead)",
        "contact_phone": "+91-44-27429180",
        "contact_email": "chengalpattu.hub@tn.disaster.demo",
        "latitude": 12.6841,
        "longitude": 79.9836,
        "map_x": 69.0,
        "map_y": 24.0,
    },
    {
        "code": "DC-TNV-01",
        "name": "Tirunelveli Tamirabarani Supply Base",
        "district": "Tirunelveli",
        "address": "High Grounds Relief Sheds, Palayamkottai, Tirunelveli 627002",
        "contact_person": "N. Muthuraman (District Officer)",
        "contact_phone": "+91-462-2572100",
        "contact_email": "tirunelveli.base@tn.disaster.demo",
        "latitude": 8.7139,
        "longitude": 77.7567,
        "map_x": 38.0,
        "map_y": 82.0,
    },
    {
        "code": "DC-TTK-01",
        "name": "Thoothukudi Port Relief Warehouse",
        "district": "Thoothukudi",
        "address": "Harbor Estate Depot, Beach Road, Thoothukudi 628001",
        "contact_person": "G. Paulraj (Marine Relief Officer)",
        "contact_phone": "+91-461-2352890",
        "contact_email": "thoothukudi.depot@tn.disaster.demo",
        "latitude": 8.7642,
        "longitude": 78.1348,
        "map_x": 45.0,
        "map_y": 84.0,
    },
    {
        "code": "DC-MYL-01",
        "name": "Mayiladuthurai Coastal Recovery Depot",
        "district": "Mayiladuthurai",
        "address": "Sirkazhi Highway Emergency Facility, Mayiladuthurai 609001",
        "contact_person": "D. Sivakumar (Camp Manager)",
        "contact_phone": "+91-4364-222450",
        "contact_email": "mayiladuthurai.depot@tn.disaster.demo",
        "latitude": 11.1018,
        "longitude": 79.6522,
        "map_x": 70.0,
        "map_y": 44.0,
    },
]

RELIEF_SUPPLY_CATALOG = [
    {"name": "Drinking Water Bottles (1L)", "category": "Water", "unit": "bottles", "threshold": 60, "base_qty": 650},
    {"name": "Drinking Water Cans (20L)", "category": "Water", "unit": "cans", "threshold": 20, "base_qty": 140},
    {"name": "Rice, Wheat & Staple Grains (10kg)", "category": "Food", "unit": "packs", "threshold": 30, "base_qty": 320},
    {"name": "Ready-to-Eat Meal Packets", "category": "Food", "unit": "packets", "threshold": 100, "base_qty": 750},
    {"name": "Milk Powder & Nutritional Tins", "category": "Nutrition", "unit": "tins", "threshold": 25, "base_qty": 180},
    {"name": "First-Aid Emergency Kits", "category": "Medical", "unit": "kits", "threshold": 15, "base_qty": 90},
    {"name": "Essential Medicines & ORS Packs", "category": "Medical", "unit": "packs", "threshold": 20, "base_qty": 160},
    {"name": "Family Hygiene Kits", "category": "Hygiene", "unit": "kits", "threshold": 25, "base_qty": 210},
    {"name": "Sanitary Pads Multi-Packs", "category": "Hygiene", "unit": "packs", "threshold": 40, "base_qty": 340},
    {"name": "Baby-Care & Infant Supplies", "category": "Baby Care", "unit": "kits", "threshold": 15, "base_qty": 110},
    {"name": "Blankets & Bedsheets", "category": "Shelter & Bedding", "unit": "pieces", "threshold": 35, "base_qty": 280},
    {"name": "Emergency Clothing Packs", "category": "Clothing", "unit": "packs", "threshold": 20, "base_qty": 190},
    {"name": "Temporary Shelter Kits & Tarpaulins", "category": "Shelter & Bedding", "unit": "kits", "threshold": 15, "base_qty": 95},
    {"name": "Mosquito Nets", "category": "Shelter & Bedding", "unit": "nets", "threshold": 30, "base_qty": 220},
    {"name": "Cleaning & Sanitation Disinfectants", "category": "Hygiene", "unit": "kits", "threshold": 20, "base_qty": 150},
    {"name": "Emergency Solar Lights & Batteries", "category": "Emergency Equipment", "unit": "sets", "threshold": 15, "base_qty": 105},
]


def seed_distribution_centres_and_inventory(db) -> list[DistributionCentre]:
    centres: list[DistributionCentre] = []
    for c_idx, spec in enumerate(DISTRIBUTION_CENTRE_SPECS):
        centre = db.scalar(select(DistributionCentre).where(DistributionCentre.code == spec["code"]))
        if centre is None:
            centre = DistributionCentre(
                code=spec["code"],
                name=spec["name"],
                district=spec["district"],
                address=spec["address"],
                contact_person=spec["contact_person"],
                contact_phone=spec["contact_phone"],
                contact_email=spec["contact_email"],
                latitude=spec["latitude"],
                longitude=spec["longitude"],
                map_x=spec["map_x"],
                map_y=spec["map_y"],
                operating_status="ACTIVE",
            )
            db.add(centre)
            db.flush()
        centres.append(centre)

        for i_idx, item in enumerate(RELIEF_SUPPLY_CATALOG):
            inv = db.scalar(
                select(SupplyInventory).where(
                    SupplyInventory.centre_id == centre.id,
                    SupplyInventory.item_name == item["name"],
                )
            )
            if inv is None:
                multiplier = 0.5 + ((c_idx * 3 + i_idx * 7) % 11) * 0.15
                base = int(item["base_qty"] * multiplier)
                threshold = item["threshold"]

                if c_idx == 1 and i_idx == 12:
                    available = 8
                elif c_idx == 3 and i_idx == 0:
                    available = 0
                elif c_idx == 4 and i_idx == 5:
                    available = 6
                elif c_idx == 7 and i_idx == 9:
                    available = 0
                elif c_idx == 9 and i_idx == 14:
                    available = 12
                else:
                    available = max(threshold + 15, base)

                allocated = int(available * 0.15)
                delivered = int(available * 0.10)
                storage_loc = f"Bay {chr(65 + (i_idx % 6))}-{(c_idx % 4) + 1}, Rack {(i_idx % 8) + 1}"

                inv = SupplyInventory(
                    centre_id=centre.id,
                    item_name=item["name"],
                    category=item["category"],
                    unit=item["unit"],
                    quantity_available=available,
                    quantity_reserved=0,
                    quantity_allocated=allocated,
                    quantity_delivered=delivered,
                    storage_location=storage_loc,
                    low_stock_threshold=threshold,
                )
                db.add(inv)

    db.commit()
    return centres


# ==============================================================================
# REALISTIC BENEFICIARY REQUESTS & ALLOCATIONS SEEDING
# ==============================================================================

MOCK_BENEFICIARY_PROFILES = [
    {
        "name": "Karthik Subramanian",
        "district": "Chennai",
        "locality": "Velachery Lake Flooded Sector 4",
        "disaster": "Flood",
        "family": 5,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "FULLY_ALLOCATED",
        "deliv_status": "DELIVERED",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 15),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 5),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Meenakshi Sundaram",
        "district": "Cuddalore",
        "locality": "Pennaiyar River Bund Colony, Cuddalore",
        "disaster": "Flood",
        "family": 4,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "PARTIALLY_ALLOCATED",
        "deliv_status": "DISPATCHED",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("First-Aid Emergency Kits", "Medical", "kits", 1),
        ],
    },
    {
        "name": "Selvam Murugan",
        "district": "Nagapattinam",
        "locality": "Velankanni Coastal Fishing Village",
        "disaster": "Cyclone",
        "family": 6,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 30),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 20),
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 3),
            ("Mosquito Nets", "Shelter & Bedding", "nets", 4),
        ],
    },
    {
        "name": "Revathi Anand",
        "district": "Thanjavur",
        "locality": "Thiruvaiyaru Agricultural Relief Settlement",
        "disaster": "Flood",
        "family": 3,
        "priority": "NORMAL",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
            ("Drinking Water Bottles (1L)", "Water", "bottles", 20),
            ("Sanitary Pads Multi-Packs", "Hygiene", "packs", 3),
        ],
    },
    {
        "name": "Balamurugan Kandasamy",
        "district": "Tiruvallur",
        "locality": "Kosasthalaiyar River Edge Shelter, Ennore",
        "disaster": "Flood",
        "family": 4,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "AWAITING_SUPPLIES",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 5),
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("Baby-Care & Infant Supplies", "Baby Care", "kits", 1),
        ],
    },
    {
        "name": "Kamala Natarajan",
        "district": "Villupuram",
        "locality": "Thenpennai Lowland Settlement, Villupuram",
        "disaster": "Flood",
        "family": 5,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "FULLY_ALLOCATED",
        "deliv_status": "DISPATCHED",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 3),
            ("Drinking Water Bottles (1L)", "Water", "bottles", 25),
            ("Emergency Clothing Packs", "Clothing", "packs", 2),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Vignesh Elumalai",
        "district": "Chengalpattu",
        "locality": "Madurantakam Flood Rescue Camp",
        "disaster": "Flood",
        "family": 3,
        "priority": "NORMAL",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Ready-to-Eat Meal Packets", "Food", "packets", 12),
            ("Drinking Water Cans (20L)", "Water", "cans", 2),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 3),
        ],
    },
    {
        "name": "Amsaveni Muthukumar",
        "district": "Tirunelveli",
        "locality": "Tamirabarani River Basin Colony, Palayamkottai",
        "disaster": "Flood",
        "family": 6,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "PARTIALLY_ALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 4),
            ("Drinking Water Cans (20L)", "Water", "cans", 6),
            ("Baby-Care & Infant Supplies", "Baby Care", "kits", 2),
            ("Essential Medicines & ORS Packs", "Medical", "packs", 2),
        ],
    },
    {
        "name": "Thirunavukkarasu Pillai",
        "district": "Thoothukudi",
        "locality": "Salt Pans Submerged Colony, Thoothukudi",
        "disaster": "Flood",
        "family": 4,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 40),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 16),
            ("Emergency Solar Lights & Batteries", "Emergency Equipment", "sets", 2),
        ],
    },
    {
        "name": "Saraswathi Dharmalingam",
        "district": "Mayiladuthurai",
        "locality": "Sirkazhi Cyclone Shelter Block C",
        "disaster": "Cyclone",
        "family": 4,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "FULLY_ALLOCATED",
        "deliv_status": "DELIVERED",
        "items": [
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Sanitary Pads Multi-Packs", "Hygiene", "packs", 4),
            ("First-Aid Emergency Kits", "Medical", "kits", 1),
        ],
    },
    {
        "name": "Anbazhagan Veerappan",
        "district": "Chennai",
        "locality": "Saidapet Adyar River Bank Slum",
        "disaster": "Flood",
        "family": 5,
        "priority": "URGENT",
        "status": "PENDING",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 3),
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 5),
        ],
    },
    {
        "name": "Fathima Begum",
        "district": "Cuddalore",
        "locality": "Chidambaram Lowland Evacuation Point",
        "disaster": "Flood",
        "family": 4,
        "priority": "HIGH",
        "status": "UNDER_REVIEW",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 24),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 16),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Rajendran Chinnasamy",
        "district": "Nagapattinam",
        "locality": "Tarangambadi Shore Evacuation Hub",
        "disaster": "Cyclone",
        "family": 5,
        "priority": "HIGH",
        "status": "PENDING",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Emergency Solar Lights & Batteries", "Emergency Equipment", "sets", 2),
        ],
    },
    {
        "name": "Dhanalakshmi Sekar",
        "district": "Thanjavur",
        "locality": "Kumbakonam Delta Village Cluster",
        "disaster": "Flood",
        "family": 3,
        "priority": "NORMAL",
        "status": "UNDER_REVIEW",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
            ("Drinking Water Bottles (1L)", "Water", "bottles", 15),
            ("Mosquito Nets", "Shelter & Bedding", "nets", 2),
        ],
    },
    {
        "name": "Venkatesan Radhakrishnan",
        "district": "Villupuram",
        "locality": "Gingee Fort Foothill Settlement",
        "disaster": "Fire",
        "family": 4,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("Emergency Clothing Packs", "Clothing", "packs", 3),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 4),
            ("First-Aid Emergency Kits", "Medical", "kits", 2),
        ],
    },
    {
        "name": "Nalini Jayachandran",
        "district": "Tiruvallur",
        "locality": "Gummidipoondi Flood Camp 2",
        "disaster": "Flood",
        "family": 6,
        "priority": "HIGH",
        "status": "REJECTED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 6),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 20),
        ],
    },
    {
        "name": "Gopinath Arumugam",
        "district": "Chengalpattu",
        "locality": "Tambaram Mudichur Low Basin",
        "disaster": "Flood",
        "family": 4,
        "priority": "HIGH",
        "status": "DUPLICATE_FLAGGED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 30),
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
        ],
    },
    {
        "name": "Pachaiyappan Kannan",
        "district": "Tirunelveli",
        "locality": "Ambasamudram River Surge Ward",
        "disaster": "Flood",
        "family": 4,
        "priority": "NORMAL",
        "status": "PENDING",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Stella Mary",
        "district": "Thoothukudi",
        "locality": "Therespuram Coastal Fishermen Colony",
        "disaster": "Cyclone",
        "family": 5,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "FULLY_ALLOCATED",
        "deliv_status": "DELIVERED",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 3),
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Mosquito Nets", "Shelter & Bedding", "nets", 4),
        ],
    },
    {
        "name": "Sivagami Palanivel",
        "district": "Mayiladuthurai",
        "locality": "Poompuhar Coast Inundated Ward 7",
        "disaster": "Cyclone",
        "family": 4,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "AWAITING_SUPPLIES",
        "deliv_status": "PENDING",
        "items": [
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 3),
            ("Emergency Solar Lights & Batteries", "Emergency Equipment", "sets", 2),
            ("Cleaning & Sanitation Disinfectants", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Kavitha Loganathan",
        "district": "Chennai",
        "locality": "Manali Petrochemical Belt Flooded Ward",
        "disaster": "Flood",
        "family": 4,
        "priority": "NORMAL",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Ready-to-Eat Meal Packets", "Food", "packets", 15),
            ("Drinking Water Bottles (1L)", "Water", "bottles", 20),
            ("Sanitary Pads Multi-Packs", "Hygiene", "packs", 2),
        ],
    },
    {
        "name": "Arulmozhi Varman",
        "district": "Cuddalore",
        "locality": "Kurinjipadi Inundated Agrarian Block",
        "disaster": "Flood",
        "family": 5,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "PARTIALLY_ALLOCATED",
        "deliv_status": "DISPATCHED",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 3),
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 5),
        ],
    },
    {
        "name": "Devendran Munusamy",
        "district": "Nagapattinam",
        "locality": "Kilvelur Flood Evacuation Community Centre",
        "disaster": "Flood",
        "family": 3,
        "priority": "NORMAL",
        "status": "PENDING",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 20),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 10),
        ],
    },
    {
        "name": "Jayalakshmi Sundar",
        "district": "Thanjavur",
        "locality": "Papanasam Kaveri Flood Canal Ward",
        "disaster": "Flood",
        "family": 4,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Emergency Clothing Packs", "Clothing", "packs", 2),
        ],
    },
    {
        "name": "Muthulakshmi Karuppan",
        "district": "Villupuram",
        "locality": "Marakkanam Salt Water Inundated Colony",
        "disaster": "Cyclone",
        "family": 5,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "FULLY_ALLOCATED",
        "deliv_status": "DELIVERED",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 20),
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Senthil Nathan",
        "district": "Tiruvallur",
        "locality": "Puzhal Overflow Affected Settlement",
        "disaster": "Flood",
        "family": 4,
        "priority": "NORMAL",
        "status": "UNDER_REVIEW",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 25),
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
        ],
    },
    {
        "name": "Bhuvana Krishnan",
        "district": "Chengalpattu",
        "locality": "Pallavaram Low Basin Relief Shelter",
        "disaster": "Flood",
        "family": 3,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 12),
            ("Baby-Care & Infant Supplies", "Baby Care", "kits", 1),
        ],
    },
    {
        "name": "Rangarajan Venkat",
        "district": "Tirunelveli",
        "locality": "Cheranmahadevi Basin Evacuation Camp",
        "disaster": "Flood",
        "family": 5,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 3),
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 5),
            ("Emergency Solar Lights & Batteries", "Emergency Equipment", "sets", 2),
        ],
    },
    {
        "name": "Anusuya Thangavel",
        "district": "Thoothukudi",
        "locality": "Kayalpattinam Coastal High Water Zone",
        "disaster": "Storm",
        "family": 4,
        "priority": "NORMAL",
        "status": "PENDING",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 30),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
    {
        "name": "Vijayalakshmi Mohan",
        "district": "Mayiladuthurai",
        "locality": "Kollidam River Flood Edge Ward",
        "disaster": "Flood",
        "family": 4,
        "priority": "HIGH",
        "status": "VERIFIED",
        "alloc_status": "PARTIALLY_ALLOCATED",
        "deliv_status": "DISPATCHED",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 2),
            ("Drinking Water Cans (20L)", "Water", "cans", 3),
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
        ],
    },
    {
        "name": "Saravanan Gunasekaran",
        "district": "Chennai",
        "locality": "Perambur Railway Canal Surge Colony",
        "disaster": "Flood",
        "family": 5,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Cans (20L)", "Water", "cans", 5),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 20),
            ("Blankets & Bedsheets", "Shelter & Bedding", "pieces", 5),
            ("First-Aid Emergency Kits", "Medical", "kits", 2),
        ],
    },
    {
        "name": "Latha Prabhakaran",
        "district": "Cuddalore",
        "locality": "Vadalur Evacuation Hall, Cuddalore",
        "disaster": "Fire",
        "family": 4,
        "priority": "URGENT",
        "status": "VERIFIED",
        "alloc_status": "FULLY_ALLOCATED",
        "deliv_status": "DELIVERED",
        "items": [
            ("Temporary Shelter Kits & Heavy Tarpaulins", "Shelter & Bedding", "kits", 2),
            ("Emergency Clothing Packs", "Clothing", "packs", 3),
            ("Drinking Water Bottles (1L)", "Water", "bottles", 30),
            ("First-Aid Emergency Kits", "Medical", "kits", 1),
        ],
    },
    {
        "name": "Manivannan Natarajan",
        "district": "Nagapattinam",
        "locality": "Nagore Coastal Lowlands Ward 12",
        "disaster": "Cyclone",
        "family": 6,
        "priority": "HIGH",
        "status": "UNDER_REVIEW",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Rice, Wheat & Staple Grains (10kg)", "Food", "packs", 3),
            ("Drinking Water Cans (20L)", "Water", "cans", 4),
            ("Mosquito Nets", "Shelter & Bedding", "nets", 4),
        ],
    },
    {
        "name": "Kasthuri Sivakumar",
        "district": "Thanjavur",
        "locality": "Budalur Farm Workers Relief Camp",
        "disaster": "Flood",
        "family": 3,
        "priority": "NORMAL",
        "status": "VERIFIED",
        "alloc_status": "UNALLOCATED",
        "deliv_status": "PENDING",
        "items": [
            ("Drinking Water Bottles (1L)", "Water", "bottles", 20),
            ("Ready-to-Eat Meal Packets", "Food", "packets", 12),
            ("Family Hygiene Kits", "Hygiene", "kits", 2),
        ],
    },
]


def seed_beneficiaries_and_requests(db, officers: list[User], centres: list[DistributionCentre]) -> tuple[int, dict[str, int]]:
    district_to_centre = {c.district: c for c in centres}
    fallback_centre = centres[0]

    demo_beneficiary_user = db.scalar(select(User).where(User.email == "beneficiary@example.com"))

    created = 0
    counters = {"VERIFIED": 0, "PENDING": 0, "UNDER_REVIEW": 0, "REJECTED": 0, "DUPLICATE_FLAGGED": 0}

    for index, profile in enumerate(MOCK_BENEFICIARY_PROFILES):
        app_id = f"SIM-DR-{(index + 1):04d}"
        officer = officers[index % len(officers)]
        centre = district_to_centre.get(profile["district"], fallback_centre)

        beneficiary = db.scalar(select(Beneficiary).where(Beneficiary.application_id == app_id))
        if beneficiary is None:
            dob = date.today() - timedelta(days=random.randint(20 * 365, 60 * 365))
            aadhaar_seed = f"{profile['name']}-{profile['district']}-{index + 1}"
            linked_user_id = demo_beneficiary_user.id if (demo_beneficiary_user and index == 0) else officer.id

            beneficiary = Beneficiary(
                application_id=app_id,
                name=profile["name"],
                date_of_birth=dob,
                gender=random.choice(["Male", "Female"]),
                phone=f"+9188{index:08d}",
                address=f"{index + 10}, {profile['locality']}, {profile['district']}, Tamil Nadu ({DEMO_TAG})",
                district=profile["district"],
                state="Tamil Nadu",
                pincode=str(600000 + (index * 137) % 29000),
                disaster_type=profile["disaster"],
                affected_location=f"{profile['locality']} ({DEMO_TAG})",
                date_affected=date.today() - timedelta(days=random.randint(3, 45)),
                family_size=profile["family"],
                number_of_dependents=max(0, profile["family"] - 2),
                masked_aadhaar=f"XXXX-XXXX-{random.randint(1000, 9999)}",
                aadhaar_hash=hashlib.sha256(aadhaar_seed.encode("utf-8")).hexdigest(),
                verification_status=profile["status"],
                verification_score=88 if profile["status"] == "VERIFIED" else 55 if profile["status"] == "UNDER_REVIEW" else 0,
                duplicate_status="FLAGGED" if profile["status"] == "DUPLICATE_FLAGGED" else "NONE",
                duplicate_reason="Similar address and family composition" if profile["status"] == "DUPLICATE_FLAGGED" else None,
                priority_level=profile["priority"],
                allocation_status=profile["alloc_status"],
                delivery_status=profile["deliv_status"],
                created_by_id=linked_user_id,
                created_at=utc_now() - timedelta(days=random.randint(2, 35)),
                updated_at=utc_now() - timedelta(days=random.randint(0, 10)),
            )
            db.add(beneficiary)
            db.flush()

            if profile["status"] != "PENDING":
                db.add(
                    VerificationRecord(
                        beneficiary_id=beneficiary.id,
                        officer_id=officer.id,
                        previous_status="PENDING",
                        new_status=profile["status"],
                        score=beneficiary.verification_score,
                        remarks=f"{DEMO_TAG}: verified against flood/disaster priority assessment checklist."
                        if profile["status"] == "VERIFIED"
                        else f"{DEMO_TAG}: verification under process.",
                        created_at=beneficiary.created_at + timedelta(days=1),
                    )
                )

            db.add(
                AuditLog(
                    user_id=officer.id,
                    beneficiary_id=beneficiary.id,
                    action="BENEFICIARY_REVIEWED" if profile["status"] == "VERIFIED" else "BENEFICIARY_CREATED",
                    entity_type="BENEFICIARY",
                    entity_id=beneficiary.application_id,
                    remarks=f"{DEMO_TAG}: request seeded with priority {profile['priority']}.",
                )
            )
        else:
            # Ensure priority and status are set on existing record
            if not beneficiary.priority_level or beneficiary.priority_level == "NORMAL":
                beneficiary.priority_level = profile["priority"]
            if not beneficiary.allocation_status or beneficiary.allocation_status == "UNALLOCATED":
                beneficiary.allocation_status = profile["alloc_status"]
            if not beneficiary.delivery_status or beneficiary.delivery_status == "PENDING":
                beneficiary.delivery_status = profile["deliv_status"]
            # If demo beneficiary user exists, link first profile to them so demo account has data
            if demo_beneficiary_user and index == 0:
                beneficiary.created_by_id = demo_beneficiary_user.id

        existing_items = db.scalars(
            select(ReliefRequestItem).where(ReliefRequestItem.beneficiary_id == beneficiary.id)
        ).all()
        if not existing_items:
            for item_name, category, unit, qty_req in profile["items"]:
                if profile["alloc_status"] == "FULLY_ALLOCATED":
                    qty_alloc = qty_req
                    qty_deliv = qty_req if profile["deliv_status"] == "DELIVERED" else 0
                    item_status = "FULFILLED"
                elif profile["alloc_status"] == "PARTIALLY_ALLOCATED":
                    qty_alloc = max(1, qty_req // 2)
                    qty_deliv = qty_alloc if profile["deliv_status"] == "DELIVERED" else 0
                    item_status = "PARTIAL"
                elif profile["alloc_status"] == "AWAITING_SUPPLIES":
                    qty_alloc = 0
                    qty_deliv = 0
                    item_status = "AWAITING_STOCK"
                else:
                    qty_alloc = 0
                    qty_deliv = 0
                    item_status = "PENDING"

                req_item = ReliefRequestItem(
                    beneficiary_id=beneficiary.id,
                    item_name=item_name,
                    category=category,
                    unit=unit,
                    quantity_requested=qty_req,
                    quantity_allocated=qty_alloc,
                    quantity_delivered=qty_deliv,
                    status=item_status,
                )
                db.add(req_item)
                db.flush()

                if qty_alloc > 0:
                    inventory_match = db.scalar(
                        select(SupplyInventory).where(
                            SupplyInventory.centre_id == centre.id,
                            SupplyInventory.item_name == item_name,
                        )
                    )
                    inv_id = inventory_match.id if inventory_match else 1
                    alloc_status = "DELIVERED" if profile["deliv_status"] == "DELIVERED" else "DISPATCHED" if profile["deliv_status"] == "DISPATCHED" else "ALLOCATED"
                    alloc = SupplyAllocation(
                        beneficiary_id=beneficiary.id,
                        request_item_id=req_item.id,
                        centre_id=centre.id,
                        inventory_id=inv_id,
                        officer_id=officer.id,
                        quantity_allocated=qty_alloc,
                        quantity_delivered=qty_deliv,
                        unit=unit,
                        status=alloc_status,
                        notes=f"{DEMO_TAG}: allocation fulfilled from {centre.name}",
                        allocated_at=beneficiary.created_at + timedelta(days=2),
                        dispatched_at=beneficiary.created_at + timedelta(days=2, hours=4) if alloc_status in {"DISPATCHED", "DELIVERED"} else None,
                        delivered_at=beneficiary.created_at + timedelta(days=3) if alloc_status == "DELIVERED" else None,
                    )
                    db.add(alloc)

        created += 1
        counters[profile["status"]] = counters.get(profile["status"], 0) + 1

    db.commit()
    return created, counters


def ensure_complete_seed_data(db) -> dict[str, object]:
    admin = ensure_main_admin(db)
    officers = ensure_officers(db, admin)
    donors = ensure_donors(db)
    pledges = seed_donor_pledges(db, donors)
    centres = seed_distribution_centres_and_inventory(db)
    beneficiary_count, counters = seed_beneficiaries_and_requests(db, officers, centres)

    report = {
        "accounts": [
            {"role": "MAIN_ADMIN", "email": admin.email},
            *[{"role": "VERIFICATION_OFFICER", "email": officer.email} for officer in officers if officer.role == "VERIFICATION_OFFICER"],
            *[{"role": "DONOR", "email": donor.email} for donor in donors],
        ],
        "beneficiaries": beneficiary_count,
        "donors": len(donors),
        "officers": sum(officer.role == "VERIFICATION_OFFICER" for officer in officers),
        "main_admin": 1,
        "pledges": pledges,
        "centres": len(centres),
    }
    write_seed_report(report)
    return report


def write_seed_report(report: dict[str, object]) -> None:
    lines = [
        "# Development seed summary",
        "",
        "This file lists simulated local development account identifiers only.",
        "All generated records are SYNTHETIC DEMO DATA. Do not use in production.",
        "",
        "## Accounts",
    ]
    for item in report["accounts"]:
        lines.append(f"- {item['role']}: {item['email']}")
    lines.extend([
        "",
        "## Summary",
        f"- Distribution Centres: {report.get('centres', 10)}",
        f"- Beneficiaries: {report['beneficiaries']}",
        f"- Donors: {report['donors']}",
        f"- Officers: {report['officers']}",
        f"- Main Admin: {report['main_admin']}",
        f"- Donation pledges: {report['pledges']}",
    ])
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ensure_dev_mode()
    db = SessionLocal()
    try:
        report = ensure_complete_seed_data(db)
        print("Seed completed successfully.")
        print(f"Distribution Centres: {report.get('centres')}")
        print(f"Beneficiaries: {report['beneficiaries']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

