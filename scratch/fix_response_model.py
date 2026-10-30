path = r'FloodReliefPortal/backend/app/main.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_s = 'return {"items": list(catalog.values()), "total": len(catalog)}'
new_s = 'return {"items": [SupplyInventoryResponse(**v) for v in catalog.values()], "total": len(catalog)}'

assert old_s in text, "old_s not found"
text = text.replace(old_s, new_s, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated return to SupplyInventoryResponse")
