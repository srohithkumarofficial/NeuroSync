import re
import unittest

from backend.verification.schemas.models import EvidenceBundle, VerificationRequest
from backend.verification.service import VerificationFirewall


class VerificationFirewallTests(unittest.TestCase):
    def setUp(self) -> None:
        self.firewall = VerificationFirewall()

    def verify(self, response: str, evidence: EvidenceBundle) -> object:
        return self.firewall.verify(VerificationRequest(response=response, evidence=evidence))

    def test_supported_numerical_claim_passes(self) -> None:
        result = self.verify("The MRI analysis detected 4 predicted lesions.", EvidenceBundle(lesion_count=4))
        self.assertEqual(result.action, "PASS")
        self.assertEqual(result.claims[0].status, "SUPPORTED")

    def test_contradictory_numerical_claim(self) -> None:
        result = self.verify("The MRI analysis detected 9 lesions.", EvidenceBundle(lesion_count=4))
        self.assertEqual(result.claims[0].status, "CONTRADICTED")
        self.assertFalse(result.verified)

    def test_unsupported_diagnosis_is_high_risk(self) -> None:
        result = self.verify("The patient definitely has multiple sclerosis.", EvidenceBundle(lesion_count=4))
        self.assertEqual(result.claims[0].status, "UNSUPPORTED")
        self.assertEqual(result.claims[0].risk, "HIGH")
        self.assertIn(result.action, {"REWRITE", "BLOCK"})

    def test_mixed_response_rewrites(self) -> None:
        result = self.verify(
            "The MRI detected 4 lesions with 1.47 mL lesion volume, proving the patient has MS.",
            EvidenceBundle(lesion_count=4, lesion_volume_ml=1.47, lesion_voxels=1470),
        )
        statuses = [claim.status for claim in result.claims]
        self.assertIn("SUPPORTED", statuses)
        self.assertIn("UNSUPPORTED", statuses)
        self.assertEqual(result.action, "REWRITE")
        self.assertIsNotNone(result.rewritten_response)
        self.assertIn("4 predicted lesion regions", result.rewritten_response or "")
        self.assertIn("1.47 mL", result.rewritten_response or "")

    def test_safe_supported_response_passes(self) -> None:
        result = self.verify(
            "The segmentation output contains 1470 lesion voxels.",
            EvidenceBundle(lesion_voxels=1470),
        )
        self.assertTrue(result.verified)
        self.assertEqual(result.action, "PASS")

    def test_generic_patient_header_is_not_verified_as_evidence(self) -> None:
        result = self.verify(
            "Findings: Patient: RAM (ID: NS-10001), Male, DOB: 2011-06-07. MRI analysis identified two lesions.",
            EvidenceBundle(lesion_count=2),
        )
        self.assertEqual(len(result.claims), 1)
        self.assertEqual(result.claims[0].text, "MRI analysis identified two lesions")
        self.assertEqual(result.claims[0].status, "SUPPORTED")

    def test_mask_shape_uses_structured_evidence(self) -> None:
        result = self.verify(
            "The segmented lesion mask has a shape of [182, 218, 182].",
            EvidenceBundle(shape=[182, 218, 182]),
        )
        self.assertTrue(result.verified)
        self.assertEqual(result.claims[0].status, "SUPPORTED")

    def test_rag_claim_with_supporting_document(self) -> None:
        result = self.verify(
            "The MRI analysis detected four lesion candidates.",
            EvidenceBundle(trusted_documents=["Four lesion candidates were detected by the segmentation model."]),
        )
        self.assertEqual(result.claims[0].status, "SUPPORTED")
        self.assertEqual(result.claims[0].nli_label, "ENTAILMENT")

    def test_rag_claim_contradicting_document(self) -> None:
        result = self.verify(
            "The MRI analysis detected 10 lesion candidates.",
            EvidenceBundle(trusted_documents=["Four lesion candidates were detected by the segmentation model."]),
        )
        self.assertEqual(result.claims[0].status, "CONTRADICTED")
        self.assertEqual(result.claims[0].nli_label, "CONTRADICTION")

    def test_rewriter_does_not_introduce_new_numerical_facts(self) -> None:
        result = self.verify(
            "The MRI detected 4 lesions, proving the patient has MS.",
            EvidenceBundle(lesion_count=4),
        )
        rewritten = result.rewritten_response or ""
        numbers = set(re.findall(r"\b\d+(?:\.\d+)?\b", rewritten))
        self.assertLessEqual(numbers, {"4"})
        self.assertNotIn("definitely", rewritten.lower())
        self.assertNotIn("proving", rewritten.lower())


if __name__ == "__main__":
    unittest.main()
