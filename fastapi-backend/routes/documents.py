from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel, model_serializer

from services.application_service import save_document
from services.document_engine import extract_from_document
from utils.supabase_client import get_supabase


router = APIRouter()

TEMP_DIR = Path("temp")


DOC_KEYWORDS: dict[str, list[str]] = {
    "caste_certificate": [
        "caste",
        "tribe",
        "scheduled",
        "community",
        "certificate",
        "tahsildar",
    ],
    "marksheet": [
        "marks",
        "marksheet",
        "mark sheet",
        "grade",
        "percentage",
        "total",
        "result",
        "examination",
        "subject",
        "degree",
        "semester",
        "aggregate",
    ],
    "admission_letter": [
        "admission",
        "offer",
        "university",
        "programme",
        "program",
        "course",
        "intake",
        "enrol",
        "enrollment",
    ],
    "domicile_certificate": [
        "domicile",
        "residence",
        "resident",
        "district",
        "state",
        "certificate",
    ],
}


class ExtractedFields(BaseModel):
    name: str | None = None
    income: float | None = None
    issue_date: str | None = None
    category: str | None = None
    percentage: float | None = None
    cgpa: float | None = None


class DocumentSignals(BaseModel):
    looks_like_income_certificate: bool = False
    looks_like_caste_certificate: bool = False
    looks_like_marksheet: bool = False
    looks_like_admission_document: bool = False
    looks_like_domicile: bool = False


class DocumentExtractData(BaseModel):
    raw_text: str
    extracted_fields: ExtractedFields
    document_signals: DocumentSignals
    mismatch: bool
    difference: float
    flag_reason: str | None = None
    file_url: str | None = None
    re_verified: bool = False

    @model_serializer(mode="wrap")
    def omit_flag_when_matched(self, serializer):
        payload = serializer(self)

        if not payload.get("mismatch"):
            payload.pop("flag_reason", None)

        return payload


class ApiResponse(BaseModel):
    success: bool
    data: DocumentExtractData | None = None
    error: str | None = None


def apply_doc_type_verification(
    doc_type: str,
    extracted: dict,
) -> dict:
    """
    Apply document-specific validation after PaddleOCR extraction.

    Income certificates:
        Must contain a readable income value.

    Caste certificates:
        Must contain signals suggesting an ST/caste certificate.

    Marksheets:
        Must contain signals suggesting an academic marksheet.

    Admission letters:
        Must contain admission/offer/university signals.

    Other document types:
        Basic readable-text validation is applied.
    """

    result = dict(extracted)

    raw_text = (
        result.get("raw_text") or ""
    ).lower().strip()

    fields = (
        result.get("extracted_fields")
        or {}
    )

    signals = (
        result.get("document_signals")
        or {}
    )

    result["difference"] = float(
        result.get("difference") or 0.0
    )

    # ---------------------------------------------------------
    # Basic OCR readability check
    # ---------------------------------------------------------

    if not raw_text:
        result["mismatch"] = True
        result["flag_reason"] = (
            "No readable text found in the document."
        )
        return result

    # ---------------------------------------------------------
    # Income Certificate
    # ---------------------------------------------------------

    if doc_type == "income_certificate":
        extracted_income = fields.get("income")

        if extracted_income is None:
            result["mismatch"] = True
            result["flag_reason"] = (
                "Income could not be extracted from the "
                "uploaded income certificate."
            )
            return result

        claimed_income = float(
            result.get("claimed_income") or 0
        )

        if claimed_income > 0:
            difference = abs(
                float(extracted_income)
                - claimed_income
            )

            result["difference"] = difference

            if difference > 0.01:
                result["mismatch"] = True
                result["flag_reason"] = (
                    f"Income mismatch: claimed "
                    f"₹{claimed_income:,.0f}, "
                    f"certificate shows "
                    f"₹{float(extracted_income):,.0f}"
                )
                return result

        result["mismatch"] = False
        result["flag_reason"] = None
        return result

    # ---------------------------------------------------------
    # ST Caste Certificate
    # ---------------------------------------------------------

    if doc_type == "caste_certificate":
        looks_like_caste = (
            signals.get(
                "looks_like_caste_certificate",
                False,
            )
        )

        has_st_signal = (
            "scheduled tribe" in raw_text
            or "scheduled tribes" in raw_text
            or "tribal" in raw_text
            or " s.t." in raw_text
            or "(st)" in raw_text
            or "st certificate" in raw_text
        )

        keyword_match = any(
            keyword in raw_text
            for keyword in DOC_KEYWORDS[
                "caste_certificate"
            ]
        )

        if not (
            looks_like_caste
            or has_st_signal
            or keyword_match
        ):
            result["mismatch"] = True
            result["flag_reason"] = (
                "Uploaded document does not appear "
                "to be an ST caste certificate."
            )
            return result

        result["mismatch"] = False
        result["flag_reason"] = None
        return result

    # ---------------------------------------------------------
    # Marksheet
    # ---------------------------------------------------------

    if doc_type == "marksheet":
        looks_like_marksheet = (
            signals.get(
                "looks_like_marksheet",
                False,
            )
        )

        percentage = fields.get("percentage")
        cgpa = fields.get("cgpa")

        keyword_match = any(
            keyword in raw_text
            for keyword in DOC_KEYWORDS["marksheet"]
        )

        if not (
            looks_like_marksheet
            or percentage is not None
            or cgpa is not None
            or keyword_match
        ):
            result["mismatch"] = True
            result["flag_reason"] = (
                "Uploaded document does not appear "
                "to be an academic marksheet."
            )
            return result

        result["mismatch"] = False
        result["flag_reason"] = None
        return result

    # ---------------------------------------------------------
    # Admission Letter
    # ---------------------------------------------------------

    if doc_type == "admission_letter":
        looks_like_admission = (
            signals.get(
                "looks_like_admission_document",
                False,
            )
        )

        keyword_match = any(
            keyword in raw_text
            for keyword in DOC_KEYWORDS[
                "admission_letter"
            ]
        )

        if not (
            looks_like_admission
            or keyword_match
        ):
            result["mismatch"] = True
            result["flag_reason"] = (
                "Uploaded document does not appear "
                "to be an admission or offer letter."
            )
            return result

        result["mismatch"] = False
        result["flag_reason"] = None
        return result

    # ---------------------------------------------------------
    # Domicile Certificate
    # ---------------------------------------------------------

    if doc_type == "domicile_certificate":
        looks_like_domicile = (
            signals.get(
                "looks_like_domicile",
                False,
            )
        )

        keyword_match = any(
            keyword in raw_text
            for keyword in DOC_KEYWORDS[
                "domicile_certificate"
            ]
        )

        if not (
            looks_like_domicile
            or keyword_match
        ):
            result["mismatch"] = True
            result["flag_reason"] = (
                "Uploaded document does not appear "
                "to be a domicile certificate."
            )
            return result

        result["mismatch"] = False
        result["flag_reason"] = None
        return result

    # ---------------------------------------------------------
    # Generic fallback
    # ---------------------------------------------------------

    result["mismatch"] = False
    result["flag_reason"] = None

    return result


@router.post(
    "/upload-document",
    response_model=ApiResponse,
)
async def upload_document(
    application_id: str = Form(...),
    doc_type: str = Form(...),
    claimed_income: int = Form(0),
    file: UploadFile = File(...),
) -> ApiResponse:

    TEMP_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    suffix = (
        Path(
            file.filename
            or "upload.png"
        ).suffix
        or ".png"
    )

    temp_path = (
        TEMP_DIR
        / f"{application_id}_{doc_type}{suffix}"
    )

    try:
        # -----------------------------------------------------
        # Read uploaded file
        # -----------------------------------------------------

        contents = await file.read()

        if not contents:
            return ApiResponse(
                success=False,
                data=None,
                error="Empty file.",
            )

        temp_path.write_bytes(contents)

        # -----------------------------------------------------
        # PaddleOCR extraction
        # -----------------------------------------------------

        extracted = extract_from_document(
            str(temp_path),
            claimed_income=claimed_income,
        )

        # Keep claimed income available for validation.
        extracted["claimed_income"] = (
            claimed_income
        )

        # -----------------------------------------------------
        # Document-specific validation
        # -----------------------------------------------------

        extracted = apply_doc_type_verification(
            doc_type,
            extracted,
        )

        supabase = get_supabase()

        # -----------------------------------------------------
        # Check application
        # -----------------------------------------------------

        application_result = (
            supabase
            .table("applications")
            .select("id, status")
            .eq(
                "id",
                application_id,
            )
            .execute()
        )

        if not application_result.data:
            return ApiResponse(
                success=False,
                data=None,
                error=(
                    "Application not found."
                ),
            )

        previous_status = (
            application_result
            .data[0]
            .get("status")
        )

        was_flagged_for_review = (
            previous_status == "review"
        )

        verified = not extracted[
            "mismatch"
        ]

        re_verified = (
            was_flagged_for_review
            and verified
        )

        extracted[
            "re_verified"
        ] = re_verified

        if re_verified:
            extracted[
                "verification_message"
            ] = (
                "Corrected document successfully "
                "re-verified by AI OCR."
            )

        # -----------------------------------------------------
        # Upload original document to Supabase Storage
        # -----------------------------------------------------

        storage_filename = (
            f"{application_id}_"
            f"{doc_type}_"
            f"{uuid4()}"
            f"{suffix}"
        )

        supabase.storage \
            .from_("documents") \
            .upload(
                storage_filename,
                contents,
                {
                    "content-type": (
                        file.content_type
                        or "application/octet-stream"
                    )
                },
            )

        file_url = (
            supabase.storage
            .from_("documents")
            .get_public_url(
                storage_filename
            )
        )

        # -----------------------------------------------------
        # Save extracted result in database
        # -----------------------------------------------------

        saved_document = save_document(
            application_id=application_id,
            doc_type=doc_type,
            extracted_data=extracted,
            verified=verified,
            file_url=file_url,
        )

        # -----------------------------------------------------
        # Re-verification status log
        # -----------------------------------------------------

        if re_verified:
            (
                supabase
                .table("status_log")
                .insert(
                    {
                        "application_id": (
                            application_id
                        ),
                        "status": "review",
                        "note": (
                            f"{doc_type.replace('_', ' ').title()} "
                            "re-uploaded and successfully "
                            "re-verified by AI OCR. "
                            "Application returned for "
                            "official review."
                        ),
                    }
                )
                .execute()
            )

        # -----------------------------------------------------
        # Prepare API response
        # -----------------------------------------------------

        extracted_fields = (
            extracted.get(
                "extracted_fields",
                {},
            )
            or {}
        )

        document_signals = (
            extracted.get(
                "document_signals",
                {},
            )
            or {}
        )

        return ApiResponse(
            success=True,
            data=DocumentExtractData(
                raw_text=extracted.get(
                    "raw_text",
                    "",
                ),
                extracted_fields=ExtractedFields(
                    name=extracted_fields.get(
                        "name"
                    ),
                    income=extracted_fields.get(
                        "income"
                    ),
                    issue_date=extracted_fields.get(
                        "issue_date"
                    ),
                    category=extracted_fields.get(
                        "category"
                    ),
                    percentage=extracted_fields.get(
                        "percentage"
                    ),
                    cgpa=extracted_fields.get(
                        "cgpa"
                    ),
                ),
                document_signals=DocumentSignals(
                    looks_like_income_certificate=(
                        document_signals.get(
                            "looks_like_income_certificate",
                            False,
                        )
                    ),
                    looks_like_caste_certificate=(
                        document_signals.get(
                            "looks_like_caste_certificate",
                            False,
                        )
                    ),
                    looks_like_marksheet=(
                        document_signals.get(
                            "looks_like_marksheet",
                            False,
                        )
                    ),
                    looks_like_admission_document=(
                        document_signals.get(
                            "looks_like_admission_document",
                            False,
                        )
                    ),
                    looks_like_domicile=(
                        document_signals.get(
                            "looks_like_domicile",
                            False,
                        )
                    ),
                ),
                mismatch=extracted.get(
                    "mismatch",
                    False,
                ),
                difference=extracted.get(
                    "difference",
                    0.0,
                ),
                flag_reason=extracted.get(
                    "flag_reason"
                ),
                file_url=file_url,
                re_verified=re_verified,
            ),
            error=None,
        )

    except Exception as exc:
        return ApiResponse(
            success=False,
            data=None,
            error=str(exc),
        )

    finally:
        await file.close()

        try:
            temp_path.unlink(
                missing_ok=True
            )
        except OSError:
            pass