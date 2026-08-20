import math
import re

from backend.verification.schemas.models import Claim, EvidenceBundle, VerificationStatus

COUNT_RE = re.compile(r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:predicted\s+)?(?:lesion|lesions|lesion regions)\b", re.IGNORECASE)
VOLUME_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s*(?:ml|milliliters?)\b", re.IGNORECASE)
VOXEL_RE = re.compile(r"\b(\d+)\s+(?:lesion\s+)?voxels?\b", re.IGNORECASE)
SHAPE_RE = re.compile(r"\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]|\b(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)\b", re.IGNORECASE)
VOLUME_TOLERANCE_ML = 0.02
NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


def _numeric_result(status: VerificationStatus, confidence: float, reason: str, evidence: list[str]) -> tuple[VerificationStatus, float, str, list[str]]:
    return status, confidence, reason, evidence


def check_structured_fact(claim: Claim, evidence: EvidenceBundle) -> tuple[VerificationStatus, float, str, list[str]] | None:
    text = claim.text.lower()

    shape_match = SHAPE_RE.search(text)
    if shape_match and evidence.shape:
        groups = [group for group in shape_match.groups() if group is not None]
        claimed_shape = [int(value) for value in groups]
        if claimed_shape == evidence.shape:
            return _numeric_result("SUPPORTED", 0.99, f"Claim matches segmentation mask shape = {evidence.shape}.", ["MRI model output: shape"])
        return _numeric_result("CONTRADICTED", 0.99, f"Claim says mask shape {claimed_shape}, but evidence has shape = {evidence.shape}.", ["MRI model output: shape"])

    count_match = COUNT_RE.search(text)
    if count_match and evidence.lesion_count is not None:
        raw_count = count_match.group(1).lower()
        claimed = NUMBER_WORDS.get(raw_count, int(raw_count) if raw_count.isdigit() else -1)
        if claimed == evidence.lesion_count:
            return _numeric_result("SUPPORTED", 0.99, f"Claim matches lesion_count = {evidence.lesion_count}.", ["MRI model output: lesion_count"])
        return _numeric_result("CONTRADICTED", 0.99, f"Claim says {claimed} lesions, but evidence has lesion_count = {evidence.lesion_count}.", ["MRI model output: lesion_count"])

    volume_match = VOLUME_RE.search(text)
    if volume_match and evidence.lesion_volume_ml is not None and any(term in text for term in ("volume", "lesion", "ml")):
        claimed = float(volume_match.group(1))
        if math.isclose(claimed, evidence.lesion_volume_ml, abs_tol=VOLUME_TOLERANCE_ML):
            return _numeric_result("SUPPORTED", 0.99, f"Claim matches lesion_volume_ml = {evidence.lesion_volume_ml}.", ["MRI model output: lesion_volume_ml"])
        return _numeric_result("CONTRADICTED", 0.99, f"Claim says {claimed} mL, but evidence has lesion_volume_ml = {evidence.lesion_volume_ml}.", ["MRI model output: lesion_volume_ml"])

    voxel_match = VOXEL_RE.search(text)
    if voxel_match and evidence.lesion_voxels is not None:
        claimed = int(voxel_match.group(1))
        if claimed == evidence.lesion_voxels:
            return _numeric_result("SUPPORTED", 0.99, f"Claim matches lesion_voxels = {evidence.lesion_voxels}.", ["MRI model output: lesion_voxels"])
        return _numeric_result("CONTRADICTED", 0.99, f"Claim says {claimed} voxels, but evidence has lesion_voxels = {evidence.lesion_voxels}.", ["MRI model output: lesion_voxels"])

    if "modality" in text or any(modality.lower() in text for modality in evidence.modalities):
        missing = [modality for modality in ("T1", "FLAIR", "T2") if modality.lower() in text and modality not in evidence.modalities]
        if missing:
            return _numeric_result("CONTRADICTED", 0.92, f"Claim references missing modalities: {', '.join(missing)}.", ["MRI model input modalities"])
        if evidence.modalities:
            return _numeric_result("SUPPORTED", 0.9, f"Claim references configured modalities: {', '.join(evidence.modalities)}.", ["MRI model input modalities"])

    return None
