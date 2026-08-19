import json

import httpx

from backend.config.settings import get_settings


REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "findings": {"type": "string"},
        "impression": {"type": "string"},
        "report": {"type": "string"},
    },
    "required": ["findings", "impression", "report"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """You generate an AI-assisted clinical MRI report draft from supplied structured evidence.
Use ONLY the supplied evidence. Never invent MRI findings, lesion counts, measurements, patient history, or diagnoses.
Never change structured MRI results. Do not infer a definitive diagnosis solely from lesion segmentation.
Clearly separate Findings and Impression. Use cautious clinical language.
The output is an AI-assisted draft requiring clinician review; the clinician has final authority.
Return only JSON matching the requested schema."""


async def generate_report(evidence: dict, preferences: list[str]) -> dict[str, str]:
    settings = get_settings()
    if not settings.sarvam_api_key:
        raise RuntimeError("SARVAM_API_KEY is not configured. Add it to backend/.env.")
    prompt = json.dumps({"structuredEvidence": evidence, "reportingPreferences": preferences}, ensure_ascii=True)
    payload = {
        "model": settings.sarvam_model,
        "temperature": 0.2,
        "max_tokens": 4096,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_schema", "json_schema": {"name": "clinical_report_draft", "strict": True, "schema": REPORT_SCHEMA}},
    }
    try:
        async with httpx.AsyncClient(timeout=settings.sarvam_timeout_seconds) as client:
            response = await client.post(settings.sarvam_api_url, headers={"Authorization": f"Bearer {settings.sarvam_api_key}", "api-subscription-key": settings.sarvam_api_key, "Content-Type": "application/json"}, json=payload)
    except httpx.TimeoutException as error:
        raise RuntimeError("Sarvam report generation timed out. Please retry.") from error
    except httpx.HTTPError as error:
        raise RuntimeError("Sarvam API is unavailable. Please retry.") from error
    if response.status_code == 429:
        raise RuntimeError("Sarvam rate limit reached. Please retry shortly.")
    if response.status_code == 402:
        raise RuntimeError("Sarvam account has no available credits. Add credits to the Sarvam project and retry.")
    if response.status_code in (401, 403):
        raise RuntimeError("Sarvam authentication failed. Check SARVAM_API_KEY in backend/.env.")
    if response.status_code >= 400:
        raise RuntimeError("Sarvam API rejected the report request.")
    try:
        raw_response = response.json()

        print("\n================ SARVAM RAW RESPONSE ================")
        print(json.dumps(raw_response, indent=2, ensure_ascii=False))

        content = raw_response["choices"][0]["message"]["content"]

        print("\n================ SARVAM CONTENT ================")
        print(repr(content))

        result = json.loads(content) if isinstance(content, str) else content

        print("\n================ PARSED REPORT ================")
        print(json.dumps(result, indent=2, ensure_ascii=False))

        if not isinstance(result, dict):
            raise ValueError("Sarvam response is not a JSON object.")

        for key in REPORT_SCHEMA["required"]:
            if key not in result:
                raise ValueError(f"Missing field: {key}")

            if not isinstance(result[key], str):
                raise ValueError(f"Field '{key}' is not a string.")

            if not result[key].strip():
                raise ValueError(f"Field '{key}' is empty.")

        return {
            key: result[key].strip()
            for key in REPORT_SCHEMA["required"]
        }

    except Exception as error:
        print("\n================ SARVAM PARSING ERROR ================")
        print(type(error).__name__, str(error))

        raise RuntimeError(
            f"Sarvam returned an invalid report structure: {error}"
        ) from error
