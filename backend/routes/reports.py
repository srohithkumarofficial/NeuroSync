from fastapi import APIRouter, HTTPException

from backend.schemas.reports import ReportApproveRequest, ReportEditRequest, ReportGenerateRequest, ReportResponse
from backend.services.report_service import approve_report, create_report, edit_report, get_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/{patient_id}", response_model=ReportResponse | None)
def read_report(patient_id: str):
    return get_report(patient_id)


@router.post("/generate", response_model=ReportResponse)
async def generate_report(payload: ReportGenerateRequest):
    try:
        return await create_report(payload.patient_id, payload.clinician_id)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    except RuntimeError as error:
        raise HTTPException(503, str(error)) from error


@router.post("/{report_id}/edit", response_model=ReportResponse)
def update_report(report_id: str, payload: ReportEditRequest):
    try:
        return edit_report(report_id, payload)
    except ValueError as error:
        raise HTTPException(404, str(error)) from error


@router.post("/{report_id}/approve", response_model=ReportResponse)
def finalize_report(report_id: str, payload: ReportApproveRequest):
    try:
        return approve_report(report_id, payload.clinician_id, payload.clinician_name)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
