with open('FloodReliefPortal/backend/app/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('@app.get("/api/distribution/available-supplies")')
idx2 = text.find('@app.', idx + 10)
print(repr(text[idx:idx2]))
