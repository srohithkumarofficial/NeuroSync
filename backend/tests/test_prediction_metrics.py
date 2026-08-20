import unittest

from backend.services.prediction_metrics import prediction_label_from_mri, prediction_score_from_mri


class PredictionMetricsTests(unittest.TestCase):
    def test_ris_pattern_for_low_burden_lesions_without_progression(self) -> None:
        mri = {"lesion_count": 1, "lesion_volume_ml": 0.03, "lesion_voxels": 30}
        self.assertEqual(prediction_label_from_mri(mri), "ris")
        self.assertLess(prediction_score_from_mri(mri) or 0, 35)

    def test_cis_pattern_for_moderate_burden_or_new_lesion(self) -> None:
        mri = {"lesion_count": 2, "lesion_volume_ml": 0.4, "lesion_voxels": 400}
        progression = {"count_increase": 1, "volume_increase_pct": 5}
        self.assertEqual(prediction_label_from_mri(mri, progression), "cis")

    def test_ms_pattern_for_high_burden_or_progression(self) -> None:
        high_burden = {"lesion_count": 4, "lesion_volume_ml": 0.8, "lesion_voxels": 800}
        progressed = {"lesion_count": 2, "lesion_volume_ml": 0.5, "lesion_voxels": 500}
        self.assertEqual(prediction_label_from_mri(high_burden), "ms")
        self.assertEqual(prediction_label_from_mri(progressed, {"count_increase": 2, "volume_increase_pct": 20}), "ms")


if __name__ == "__main__":
    unittest.main()
