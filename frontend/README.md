# Disaster Relief Verification Portal

The project contains a FastAPI backend and a Vite React frontend. The public landing page offers separate Beneficiary and Donor paths; officer access is restricted to accounts created by the Main Admin.

## Requirements

- Python 3.11 or newer
- Node.js 20 or newer
- Windows PowerShell

## First-time setup

From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
Set-Location backend
..\.venv\Scripts\python.exe -m app.bootstrap_admin
```

The bootstrap command prompts for the initial Main Admin name, email, and password. The password is entered without echo and is never printed. It refuses to create another Main Admin if one already exists. Set a long random `SECRET_KEY` in `backend\.env` before sharing the environment; production mode rejects the development fallback key.

If an existing local database already has a Main Admin but its password is unavailable, reset it locally with:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m app.reset_admin_password
```

The reset command prompts for the existing Main Admin email and a new password, hashes it, records an audit entry, and revokes active sessions.

## Run the services

Start the backend in one PowerShell window:

```powershell
Set-Location "C:\path\to\FloodReliefPortal\backend"
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the frontend in a second PowerShell window:

```powershell
Set-Location "C:\path\to\FloodReliefPortal\frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://localhost:5173`. The frontend proxies `/api` calls to `http://127.0.0.1:8000`. FastAPI documentation is available at `http://localhost:8000/docs`.

## Tests

```powershell
Set-Location "C:\path\to\FloodReliefPortal\backend"
..\.venv\Scripts\python.exe -m pytest tests\test_auth_roles.py -q

Set-Location "C:\path\to\FloodReliefPortal\frontend"
npm test -- --run
npm run build
```

Donation pledges record interest only; the app does not accept payments. OCR assists with document reading and does not perform official UIDAI authentication.
