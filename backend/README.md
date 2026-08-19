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

Open `http://localhost:8000/docs` to test the API. Set the frontend root `.env` value `VITE_API_BASE_URL=http://localhost:8000` to use the MongoDB-backed application.
