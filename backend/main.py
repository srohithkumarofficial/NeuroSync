from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config.settings import get_settings
from backend.database.connection import database
from backend.routes import auth, clinical, cognitive, dashboard, exercises, mri, patients, progress, reports, sessions, users, verification


@asynccontextmanager
async def lifespan(_: FastAPI):
    database.connect()
    yield
    database.close()


app = FastAPI(title="NeuroSync API", version="1.0.0", description="Cognitive training, performance tracking, and safe adaptive recommendations.", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origins, allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"])


def error_response(status_code: int, code: str, message: str, retryable: bool = False) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"code": code, "message": message, "retryable": retryable}})


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, __: RequestValidationError):
    return error_response(422, "VALIDATION_ERROR", "The request contains invalid or missing fields.")


@app.exception_handler(HTTPException)
async def http_error(_: Request, error: HTTPException):
    detail = error.detail if isinstance(error.detail, str) else "The request could not be completed."
    code = "NOT_FOUND" if error.status_code == 404 else "REQUEST_ERROR"
    return error_response(error.status_code, code, detail, error.status_code >= 500)


@app.exception_handler(RuntimeError)
async def database_error(_: Request, __: RuntimeError):
    return error_response(503, "DATABASE_UNAVAILABLE", "The database is temporarily unavailable.", True)


@app.exception_handler(Exception)
async def unexpected_error(_: Request, __: Exception):
    return error_response(500, "INTERNAL_ERROR", "An unexpected server error occurred.", True)


@app.get("/", summary="API root")
def root():
    return {"message": "NeuroSync API is running", "verification_firewall": "available at POST /verify"}


@app.get("/api/health", summary="API health check")
def health():
    return {"status": "healthy" if database.connected else "degraded", "database": "connected" if database.connected else "unavailable"}


for router in (auth.router, users.router, patients.router, mri.router, reports.router, clinical.router, exercises.router, cognitive.router, progress.router, dashboard.router, sessions.router, verification.router):
    app.include_router(router)
