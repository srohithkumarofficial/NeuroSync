def mri_progression_from_visits(visits: list[dict]) -> dict:
    if len(visits) < 2:
        return {"count_increase": 0, "volume_increase_ml": 0.0, "volume_increase_pct": 0.0}
    latest, previous = visits[0], visits[1]
    count_increase = max(0, int(latest.get("lesionCount", 0)) - int(previous.get("lesionCount", 0)))
    previous_volume = max(0.0, float(previous.get("lesionVolumeML", 0)))
    latest_volume = max(0.0, float(latest.get("lesionVolumeML", 0)))
    volume_increase_ml = max(0.0, latest_volume - previous_volume)
    volume_increase_pct = (volume_increase_ml / previous_volume * 100) if previous_volume > 0 else 0.0
    return {"count_increase": count_increase, "volume_increase_ml": volume_increase_ml, "volume_increase_pct": volume_increase_pct}


def prediction_score_from_mri(mri: dict | None, progression: dict | None = None) -> int | None:
    if not mri:
        return None
    progression = progression or {}
    lesion_count = max(0, int(mri.get("lesion_count", 0)))
    lesion_volume_ml = max(0.0, float(mri.get("lesion_volume_ml", 0)))
    lesion_voxels = max(0, int(mri.get("lesion_voxels", 0)))
    count_increase = max(0, int(progression.get("count_increase", 0)))
    volume_increase_pct = max(0.0, float(progression.get("volume_increase_pct", 0)))

    count_score = min(lesion_count / 4, 1) * 35
    volume_score = min(lesion_volume_ml / 1.5, 1) * 25
    voxel_score = min(lesion_voxels / 1500, 1) * 10
    new_lesion_score = min(count_increase / 2, 1) * 20
    volume_progression_score = min(volume_increase_pct / 25, 1) * 10
    return round(count_score + volume_score + voxel_score + new_lesion_score + volume_progression_score)


def prediction_label_from_mri(mri: dict | None, progression: dict | None = None) -> str:
    if not mri:
        return "not_available"
    progression = progression or {}
    score = prediction_score_from_mri(mri, progression) or 0
    count_increase = int(progression.get("count_increase", 0))
    volume_increase_pct = float(progression.get("volume_increase_pct", 0))
    lesion_count = int(mri.get("lesion_count", 0))
    lesion_volume_ml = float(mri.get("lesion_volume_ml", 0))

    if score >= 70 or lesion_count >= 4 or lesion_volume_ml >= 1.5 or count_increase >= 2 or volume_increase_pct >= 25:
        return "ms"
    if score >= 35 or count_increase >= 1 or volume_increase_pct >= 10:
        return "cis"
    if lesion_count > 0:
        return "ris"
    return "lower_likelihood"


def estimated_edss_from_mri(mri: dict | None, progression: dict | None = None) -> dict | None:
    score = prediction_score_from_mri(mri, progression)
    if score is None:
        return None
    if score == 0:
        edss = 0.0
    else:
        edss = min(4.5, round((1.0 + (score / 100) * 3.5) * 2) / 2)
    if edss <= 1.5:
        band = "Minimal MRI-supported disability signal"
    elif edss <= 3.0:
        band = "Mild MRI-supported disability signal"
    else:
        band = "Moderate MRI-supported disability signal"
    return {
        "score": edss,
        "band": band,
        "note": "MRI-only estimate; formal EDSS requires neurologic functional-system and ambulation assessment.",
    }
