from pydantic import BaseModel, Field


class MRIResultCreate(BaseModel):
    patient_id: str = Field(min_length=1, max_length=80)
    lesion_count: int = Field(ge=0)
    lesion_voxels: int = Field(ge=0)
    lesion_volume_ml: float = Field(ge=0)
    shape: list[int] = Field(min_length=3, max_length=3)
    prediction_file: str = ""


class MRIResultResponse(MRIResultCreate):
    updated_at: str
    edss_score: float | None = None
    edss_band: str | None = None
    edss_note: str | None = None
