from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_email(value: str) -> str:
    normalized = value.strip().lower()
    if "@" not in normalized or normalized.count("@") != 1:
        raise ValueError("Email must include exactly one @ symbol")
    local_part, domain_part = normalized.split("@", 1)
    if not local_part or not domain_part or "." not in domain_part and domain_part != "localhost":
        raise ValueError("Email domain is invalid")
    return normalized


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=256)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class BeneficiaryRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str
    phone: str = Field(max_length=30)
    password: str = Field(min_length=8, max_length=256)
    confirm_password: str = Field(min_length=8, max_length=256)
    address: str = Field(min_length=5, max_length=500)
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(pattern=r"^[0-9]{6}$", max_length=6)

    @field_validator("phone")
    def normalize_phone(cls, value: str) -> str:
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class DonorRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str
    phone: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=256)
    confirm_password: str = Field(min_length=8, max_length=256)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class OfficerCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    email: str
    password: str = Field(min_length=12, max_length=256)
    confirm_password: str = Field(min_length=12, max_length=256)
    status: str = "ACTIVE"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=256)
    password: str = Field(min_length=12, max_length=256)
    confirm_password: str = Field(min_length=12, max_length=256)


class OfficerPasswordResetRequest(BaseModel):
    password: str = Field(min_length=12, max_length=256)
    confirm_password: str = Field(min_length=12, max_length=256)


class DonationPledgeCreate(BaseModel):
    amount: str = Field(min_length=1, max_length=40)
    campaign: str = Field(min_length=2, max_length=160)
    message: str | None = Field(default=None, max_length=500)


class ReliefRequestItemCreate(BaseModel):
    item_name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=50)
    quantity_requested: int = Field(gt=0, le=10000)
    unit: str = Field(min_length=1, max_length=30)


class BeneficiaryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    date_of_birth: date | None = None
    gender: Literal["Male", "Female", "Other"] | None = None
    phone: str = Field(max_length=30)
    address: str = Field(min_length=5, max_length=500)
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(pattern=r"^[0-9]{6}$", max_length=6)
    disaster_type: Literal["Flood", "Cyclone", "Earthquake", "Landslide", "Tsunami", "Other"]
    affected_location: str = Field(min_length=2, max_length=500)
    date_affected: date | None = None
    family_size: int = Field(ge=1, le=1000)
    number_of_dependents: int = Field(ge=0, le=1000)
    aadhaar_identifier: str | None = Field(default=None, min_length=8, max_length=64)
    priority_level: str = "NORMAL"
    requested_supplies: list[ReliefRequestItemCreate] | None = None

    @field_validator("phone")
    def normalize_phone(cls, value: str) -> str:
        return value.strip()

    @field_validator("aadhaar_identifier", mode="before")
    def normalize_aadhaar(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = str(value).strip()
        return stripped if stripped else None


class BeneficiaryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    date_of_birth: date | None = None
    gender: Literal["Male", "Female", "Other"] | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, min_length=5, max_length=500)
    district: str | None = Field(default=None, min_length=2, max_length=100)
    state: str | None = Field(default=None, min_length=2, max_length=100)
    pincode: str | None = Field(default=None, pattern=r"^[0-9]{6}$", max_length=6)
    disaster_type: Literal["Flood", "Cyclone", "Earthquake", "Landslide", "Tsunami", "Other"] | None = None
    affected_location: str | None = Field(default=None, min_length=2, max_length=500)
    date_affected: date | None = None
    family_size: int | None = Field(default=None, ge=1, le=1000)
    number_of_dependents: int | None = Field(default=None, ge=0, le=1000)
    aadhaar_identifier: str | None = Field(default=None, min_length=8, max_length=64)

    @field_validator("aadhaar_identifier", mode="before")
    def normalize_aadhaar_update(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = str(value).strip()
        return stripped if stripped else None


class VerificationRequest(BaseModel):
    new_status: Literal["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "DUPLICATE_FLAGGED"]
    remarks: str = Field(min_length=5, max_length=1000)


class DuplicateCheckRequest(BaseModel):
    aadhaar_identifier: str | None = None
    phone: str | None = None
    name: str | None = None
    date_of_birth: date | None = None
    address: str | None = None


class ReliefRequestItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    beneficiary_id: int
    item_name: str
    category: str
    unit: str
    quantity_requested: int
    quantity_allocated: int
    quantity_delivered: int
    status: str


class SupplyInventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    centre_id: int
    item_name: str
    category: str
    unit: str
    quantity_available: int
    quantity_reserved: int
    quantity_allocated: int
    quantity_delivered: int
    storage_location: str
    low_stock_threshold: int
    stock_status: str
    centre_name: str | None = None
    centre_district: str | None = None


class DistributionCentreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    district: str
    address: str
    contact_person: str
    contact_phone: str
    contact_email: str
    latitude: float
    longitude: float
    map_x: float
    map_y: float
    operating_status: str
    created_at: datetime
    total_items_count: int = 0
    in_stock_count: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    inventories: list[SupplyInventoryResponse] = []


class SupplyAllocationItem(BaseModel):
    inventory_id: int
    request_item_id: int | None = None
    quantity: int = Field(gt=0, le=10000)
    notes: str | None = None


class SupplyAllocationCreate(BaseModel):
    centre_id: int
    allocations: list[SupplyAllocationItem]


class SupplyAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    beneficiary_id: int
    request_item_id: int | None
    centre_id: int
    centre_name: str | None = None
    inventory_id: int
    item_name: str | None = None
    officer_id: int
    officer_name: str | None = None
    quantity_allocated: int
    quantity_delivered: int
    unit: str
    status: str
    notes: str | None
    allocated_at: datetime
    dispatched_at: datetime | None
    delivered_at: datetime | None


class CentreRecommendation(BaseModel):
    centre_id: int
    centre_name: str
    centre_code: str
    district: str
    address: str
    distance_km: float
    contact_phone: str
    available_stock: int
    unit: str
    can_fulfill_full: bool
    sufficient_quantity: int


class AllocationRecommendationResponse(BaseModel):
    request_item_id: int
    item_name: str
    category: str
    unit: str
    quantity_requested: int
    quantity_allocated: int
    quantity_remaining: int
    recommended_centres: list[CentreRecommendation]


class BeneficiaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    application_id: str
    name: str
    date_of_birth: date | None
    gender: str | None
    phone: str | None
    address: str | None
    district: str | None
    state: str | None
    pincode: str | None
    disaster_type: str | None
    affected_location: str | None
    date_affected: date | None
    family_size: int | None
    number_of_dependents: int | None
    masked_aadhaar: str | None
    verification_status: str
    verification_score: int
    duplicate_status: str
    duplicate_reason: str | None
    priority_level: str = "NORMAL"
    allocation_status: str = "UNALLOCATED"
    delivery_status: str = "PENDING"
    document_status: str = "PENDING"
    created_at: datetime
    updated_at: datetime
    request_items: list[ReliefRequestItemResponse] = []


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    role: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None
    last_login_at: datetime | None = None
    must_change_password: bool = False


class AuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_name: str | None
    action: str
    entity_type: str
    entity_id: str
    remarks: str | None
    created_at: datetime


class DistributionItemHandover(BaseModel):
    allocation_id: int | None = None
    inventory_id: int | None = None
    item_name: str | None = None
    unit: str | None = None
    quantity_allocated: int | None = None
    quantity_distributed: int = Field(..., ge=0)
    notes: str | None = None


class DistributionHandoverRequest(BaseModel):
    beneficiary_id: int
    centre_id: int | None = None
    officer_notes: str | None = None
    items: list[DistributionItemHandover]


class DistributionItemConfirm(BaseModel):
    item_id: int
    quantity_received: int = Field(..., ge=0)
    quantity_missing: int = Field(0, ge=0)
    reason: str | None = None


class DistributionConfirmRequest(BaseModel):
    action: str  # "CONFIRM_ALL" | "PARTIALLY_RECEIVED" | "NOT_RECEIVED" | "REPORT_ISSUE"
    feedback: str | None = None
    missing_items: list[DistributionItemConfirm] = []


class ReliefDistributionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    distribution_id: int
    allocation_id: int | None = None
    item_name: str
    category: str | None = None
    unit: str
    quantity_allocated: int
    quantity_distributed: int
    quantity_received: int | None = None
    quantity_missing: int | None = 0
    item_status: str
    notes: str | None = None


class ReliefDistributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    distribution_ref: str
    beneficiary_id: int
    beneficiary_name: str | None = None
    application_id: str | None = None
    officer_id: int
    officer_name: str | None = None
    centre_id: int | None = None
    centre_name: str | None = None
    status: str
    distributed_at: datetime
    confirmed_at: datetime | None = None
    officer_notes: str | None = None
    beneficiary_feedback: str | None = None
    discrepancy_details: str | None = None
    items: list[ReliefDistributionItemResponse] = []


class DistributionTrackingSummaryResponse(BaseModel):
    total_beneficiaries_with_allocations: int
    total_distributions_completed: int
    beneficiaries_confirmed_receipt: int
    pending_confirmations: int
    partial_or_unsuccessful: int
    reported_discrepancies: int
    distributions: list[ReliefDistributionResponse] = []
