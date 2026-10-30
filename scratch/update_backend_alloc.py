path = r'FloodReliefPortal/backend/app/main.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update allocate_supplies
old_allocate_check = '''    if beneficiary.verification_status != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only verified beneficiaries can receive relief supply allocations. Current status is {beneficiary.verification_status}."
        )'''

new_allocate_check = '''    if beneficiary.verification_status not in {"VERIFIED", "PENDING"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot allocate supplies to a beneficiary with status {beneficiary.verification_status}."
        )

    if beneficiary.verification_status == "PENDING":
        beneficiary.verification_status = "VERIFIED"'''

if old_allocate_check in text:
    text = text.replace(old_allocate_check, new_allocate_check, 1)

# 2. Update get_available_supplies
idx = text.find('@app.get("/api/distribution/available-supplies")')
idx2 = text.find('@app.', idx + 10)

new_avail_code = '''@app.get("/api/distribution/available-supplies")
def get_available_supplies(
    centre_id: int | None = None,
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

    return {"items": list(catalog.values()), "total": len(catalog)}


'''

text = text[:idx] + new_avail_code + text[idx2:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated backend main.py cleanly!")
