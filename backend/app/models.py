from datetime import datetime, timezone
from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVE")
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    beneficiaries: Mapped[list["Beneficiary"]] = relationship(back_populates="created_by")
    records: Mapped[list["VerificationRecord"]] = relationship(back_populates="officer")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")
    pledges: Mapped[list["DonationPledge"]] = relationship(back_populates="donor")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    date_of_birth: Mapped[Date] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=True)
    disaster_type: Mapped[str] = mapped_column(String(50), nullable=True)
    affected_location: Mapped[str] = mapped_column(Text, nullable=True)
    date_affected: Mapped[Date] = mapped_column(Date, nullable=True)
    family_size: Mapped[int] = mapped_column(Integer, nullable=True)
    number_of_dependents: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    masked_aadhaar: Mapped[str] = mapped_column(String(30), nullable=True)
    aadhaar_hash: Mapped[str] = mapped_column(String(64), nullable=True, index=True)
    verification_status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING", index=True)
    verification_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duplicate_status: Mapped[str] = mapped_column(String(20), nullable=False, default="NONE")
    duplicate_reason: Mapped[str] = mapped_column(Text, nullable=True)
    priority_level: Mapped[str] = mapped_column(String(20), nullable=False, default="NORMAL")
    allocation_status: Mapped[str] = mapped_column(String(30), nullable=False, default="UNALLOCATED")
    delivery_status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING")
    created_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by: Mapped["User"] = relationship(back_populates="beneficiaries")
    documents: Mapped[list["Document"]] = relationship(back_populates="beneficiary")
    records: Mapped[list["VerificationRecord"]] = relationship(back_populates="beneficiary")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="beneficiary")
    request_items: Mapped[list["ReliefRequestItem"]] = relationship(back_populates="beneficiary", cascade="all, delete-orphan")
    allocations: Mapped[list["SupplyAllocation"]] = relationship(back_populates="beneficiary", cascade="all, delete-orphan")
    distributions: Mapped[list["ReliefDistribution"]] = relationship(back_populates="beneficiary", cascade="all, delete-orphan")
    supply_requests: Mapped[list["BeneficiarySupplyRequest"]] = relationship(back_populates="beneficiary", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    ocr_status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING")
    ocr_text: Mapped[str] = mapped_column(Text, nullable=True)
    extracted_fields: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    beneficiary: Mapped[Beneficiary] = relationship(back_populates="documents")


class VerificationRecord(Base):
    __tablename__ = "verification_records"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    previous_status: Mapped[str] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    beneficiary: Mapped[Beneficiary] = relationship(back_populates="records")
    officer: Mapped[User] = relationship(back_populates="records")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(60), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(80), nullable=False)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user: Mapped["User"] = relationship(back_populates="audit_logs")
    beneficiary: Mapped["Beneficiary"] = relationship(back_populates="audit_logs")


class BeneficiaryDuplicate(Base):
    __tablename__ = "beneficiary_duplicates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    candidate_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    match_type: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    __table_args__ = (UniqueConstraint("beneficiary_id", "candidate_id", name="uq_duplicate_pair"),)


class DonationPledge(Base):
    __tablename__ = "donation_pledges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    donor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount: Mapped[str] = mapped_column(String(40), nullable=False)
    campaign: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    donor: Mapped[User] = relationship(back_populates="pledges")


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="notifications")


class DistributionCentre(Base):
    __tablename__ = "distribution_centres"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    contact_person: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    map_x: Mapped[float] = mapped_column(Float, nullable=False, default=50.0)
    map_y: Mapped[float] = mapped_column(Float, nullable=False, default=50.0)
    operating_status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    inventories: Mapped[list["SupplyInventory"]] = relationship(back_populates="centre", cascade="all, delete-orphan")
    allocations: Mapped[list["SupplyAllocation"]] = relationship(back_populates="centre")


class SupplyInventory(Base):
    __tablename__ = "supply_inventories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    centre_id: Mapped[int] = mapped_column(Integer, ForeignKey("distribution_centres.id"), nullable=False, index=True)
    item_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity_available: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quantity_reserved: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quantity_allocated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quantity_delivered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_location: Mapped[str] = mapped_column(String(100), nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    centre: Mapped[DistributionCentre] = relationship(back_populates="inventories")
    allocations: Mapped[list["SupplyAllocation"]] = relationship(back_populates="inventory")

    @property
    def stock_status(self) -> str:
        if self.quantity_available <= 0:
            return "Out of Stock"
        if self.quantity_available <= self.low_stock_threshold:
            return "Low Stock"
        return "In Stock"


class ReliefRequestItem(Base):
    __tablename__ = "relief_request_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    item_name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity_requested: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_allocated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quantity_delivered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING")
    beneficiary: Mapped[Beneficiary] = relationship(back_populates="request_items")
    allocations: Mapped[list["SupplyAllocation"]] = relationship(back_populates="request_item")


class SupplyAllocation(Base):
    __tablename__ = "supply_allocations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    request_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("relief_request_items.id"), nullable=True)
    centre_id: Mapped[int] = mapped_column(Integer, ForeignKey("distribution_centres.id"), nullable=False, index=True)
    inventory_id: Mapped[int] = mapped_column(Integer, ForeignKey("supply_inventories.id"), nullable=False, index=True)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    quantity_allocated: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_delivered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ALLOCATED")
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    allocated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    dispatched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    beneficiary: Mapped[Beneficiary] = relationship(back_populates="allocations")
    request_item: Mapped["ReliefRequestItem"] = relationship(back_populates="allocations")
    centre: Mapped[DistributionCentre] = relationship(back_populates="allocations")
    inventory: Mapped[SupplyInventory] = relationship(back_populates="allocations")
    officer: Mapped[User] = relationship()


class ReliefDistribution(Base):
    __tablename__ = "relief_distributions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    distribution_ref: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    centre_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("distribution_centres.id"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        default="Distributed – Awaiting Beneficiary Confirmation"
    )
    distributed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    officer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    beneficiary_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    discrepancy_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    beneficiary: Mapped["Beneficiary"] = relationship(back_populates="distributions")
    officer: Mapped["User"] = relationship()
    centre: Mapped["DistributionCentre | None"] = relationship()
    items: Mapped[list["ReliefDistributionItem"]] = relationship(back_populates="distribution", cascade="all, delete-orphan")
    confirmations: Mapped[list["DistributionConfirmation"]] = relationship(back_populates="distribution", cascade="all, delete-orphan")


class ReliefDistributionItem(Base):
    __tablename__ = "relief_distribution_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    distribution_id: Mapped[int] = mapped_column(Integer, ForeignKey("relief_distributions.id", ondelete="CASCADE"), nullable=False, index=True)
    allocation_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("supply_allocations.id"), nullable=True, index=True)
    inventory_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("supply_inventories.id"), nullable=True)
    item_name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str | None] = mapped_column(String(60), nullable=True)
    unit: Mapped[str] = mapped_column(String(30), nullable=False, default="units")
    quantity_allocated: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_distributed: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_received: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quantity_missing: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    item_status: Mapped[str] = mapped_column(String(60), nullable=False, default="Distributed – Awaiting Beneficiary Confirmation")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    distribution: Mapped["ReliefDistribution"] = relationship(back_populates="items")
    allocation: Mapped["SupplyAllocation | None"] = relationship()


class DistributionConfirmation(Base):
    __tablename__ = "distribution_confirmations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    distribution_id: Mapped[int] = mapped_column(Integer, ForeignKey("relief_distributions.id", ondelete="CASCADE"), nullable=False, index=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    status_applied: Mapped[str] = mapped_column(String(60), nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    missing_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    distribution: Mapped["ReliefDistribution"] = relationship(back_populates="confirmations")


class BeneficiarySupplyRequest(Base):
    __tablename__ = "beneficiary_supply_requests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_ref: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    beneficiary_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiaries.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="PENDING")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    officer_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    beneficiary: Mapped["Beneficiary"] = relationship(back_populates="supply_requests")
    reviewed_by: Mapped["User | None"] = relationship()
    items: Mapped[list["BeneficiarySupplyRequestItem"]] = relationship(back_populates="request", cascade="all, delete-orphan")


class BeneficiarySupplyRequestItem(Base):
    __tablename__ = "beneficiary_supply_request_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("beneficiary_supply_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_id: Mapped[int] = mapped_column(Integer, ForeignKey("supply_inventories.id"), nullable=False, index=True)
    item_name: Mapped[str] = mapped_column(String(140), nullable=False)
    category: Mapped[str | None] = mapped_column(String(60), nullable=True)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity_requested: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_approved: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="PENDING")
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    allocation_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("supply_allocations.id"), nullable=True)

    request: Mapped["BeneficiarySupplyRequest"] = relationship(back_populates="items")
    inventory: Mapped["SupplyInventory"] = relationship()
    allocation: Mapped["SupplyAllocation | None"] = relationship()
