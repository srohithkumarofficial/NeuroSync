# NeuroSync backend

FastAPI + MongoDB backend for the main cognitive-training application. Speech is deliberately out of scope.

## Run

From the repository root:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
python -m backend.seed.seed_data
uvicorn backend.main:app --reload --port 8000
```

If your terminal is already in the `backend` directory, use the package-qualified module and add the repository
root to Uvicorn's import path:

```powershell
python -m uvicorn backend.main:app --reload --app-dir .. --port 8000
```

Do not use `uvicorn main:app` from `backend`; the application and its routers import modules through the
`backend` package.

Open `http://localhost:8000/docs` to test the API. Set the frontend root `.env` value `VITE_API_BASE_URL=http://localhost:8000` to use the MongoDB-backed application.

For the prototype sign-in flow, create `backend/.env` with:

```env
DEFAULT_CLINICIAN_EMAIL=demo@neurosync.local
DEFAULT_CLINICIAN_PASSWORD=your-secure-password
```

The backend stores password hashes instead of plaintext secrets and rejects empty or unconfigured credentials.
