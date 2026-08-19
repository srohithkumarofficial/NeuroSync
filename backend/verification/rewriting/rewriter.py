from backend.verification.schemas.models import EvidenceBundle, VerifiedClaim


def rewrite_response(claims: list[VerifiedClaim], evidence: EvidenceBundle) -> str:
    supported = [claim for claim in claims if claim.status == "SUPPORTED"]
    parts: list[str] = []

    if evidence.lesion_count is not None:
        parts.append(f"MRI analysis detected {evidence.lesion_count} predicted lesion regions")
    if evidence.lesion_volume_ml is not None:
        volume_sentence = f"with an estimated total lesion volume of {evidence.lesion_volume_ml:g} mL"
        if parts:
            parts[-1] = f"{parts[-1]} {volume_sentence}"
        else:
            parts.append(f"MRI analysis reported {volume_sentence}")
    if evidence.lesion_voxels is not None:
        parts.append(f"The segmentation output contains {evidence.lesion_voxels} lesion voxels")

    if not parts:
        parts.extend(claim.text for claim in supported)

    unsafe_claims = [claim for claim in claims if claim.risk in ("HIGH", "VERY_HIGH") and claim.status != "SUPPORTED"]
    if unsafe_claims:
        parts.append("These model-generated findings do not by themselves establish a diagnosis or treatment recommendation. Clinical interpretation by a qualified healthcare professional is required.")

    return ". ".join(part.rstrip(".") for part in parts if part).strip() + "."
