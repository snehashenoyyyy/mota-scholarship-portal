from typing import Any, Literal
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.application_service import (
    apply_for_scheme,
    evaluate_application,
)
from utils.supabase_client import get_supabase


router = APIRouter()


# ============================================================
# APPLICATION MODELS
# ============================================================

class ApplyRequest(BaseModel):
    applicant_name: str
    applicant_email: str
    scheme_id: str
    income: float
    percentage: float


class ApplyData(BaseModel):
    application_id: str


class TraceItem(BaseModel):
    criterion: str
    passed: bool
    expected: object | None = None
    actual: object | None = None


class ApplicationStatusData(BaseModel):
    status: str
    trace: list[TraceItem]
    documents: list[dict[str, Any]]


class ApiResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: str | None = None


class DecisionRequest(BaseModel):
    decision: Literal[
        "approved",
        "review",
        "rejected",
    ]
    admin_note: str | None = None


class DisbursementRequest(BaseModel):
    amount: float
    payment_note: str | None = None


class FinalSubmitRequest(BaseModel):
    scheme: str | None = None
    income: float | None = None
    institution: str | None = None
    course: str | None = None
    marks: float | None = None


class InstituteVerificationRequest(BaseModel):
    decision: Literal[
        "verified",
        "flagged",
    ]
    note: str | None = None


# ============================================================
# FELLOWSHIP CLAIM MODELS
# ============================================================

class FellowshipClaimRequest(BaseModel):
    application_id: str | None = None
    student_name: str
    scheme: Literal["NFST", "NOS"]
    claim_type: Literal[
        "Monthly Fellowship",
        "Contingency",
        "HRA",
    ]
    claim_month: str
    amount: float
    remarks: str | None = None


class FellowshipDecisionRequest(BaseModel):
    decision: Literal[
        "approved",
        "review",
        "rejected",
    ]
    admin_note: str | None = None


class FellowshipDisbursementRequest(BaseModel):
    payment_note: str | None = None


# ============================================================
# INITIAL APPLICATION
# ============================================================

@router.post("/apply", response_model=ApiResponse)
def apply(payload: ApplyRequest) -> ApiResponse:

    try:
        application_id = apply_for_scheme(
            applicant_name=payload.applicant_name,
            applicant_email=payload.applicant_email,
            scheme_id=payload.scheme_id,
            income=payload.income,
            percentage=payload.percentage,
        )

        return ApiResponse(
            success=True,
            data=ApplyData(
                application_id=application_id
            ),
            error=None,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to submit application: {exc}",
        ) from exc


# ============================================================
# FINAL APPLICATION SUBMISSION
# ============================================================

@router.post(
    "/applications/{application_id}/submit"
)
async def submit_application(
    application_id: str,
    body: FinalSubmitRequest,
):

    try:
        supabase = get_supabase()

        application_result = (
            supabase
            .table("applications")
            .select("*")
            .eq("id", application_id)
            .execute()
        )

        if not application_result.data:
            return {
                "success": False,
                "data": None,
                "error": "Application not found.",
            }

        application = application_result.data[0]
        current_status = application.get("status")

        if current_status in {
            "approved",
            "rejected",
            "disbursed",
        }:
            return {
                "success": False,
                "data": None,
                "error": (
                    f"Application cannot be submitted "
                    f"because its current status is "
                    f"'{current_status}'."
                ),
            }

        documents_result = (
            supabase
            .table("documents")
            .select("*")
            .eq(
                "application_id",
                application_id,
            )
            .execute()
        )

        documents = documents_result.data or []

        required_documents = {
            "caste_certificate",
            "income_certificate",
            "marksheet",
        }

        uploaded_documents = {
            document.get("doc_type")
            for document in documents
            if document.get("doc_type")
        }

        missing_documents = (
            required_documents -
            uploaded_documents
        )

        if missing_documents:
            return {
                "success": False,
                "data": None,
                "error": (
                    "Required documents are missing: "
                    + ", ".join(
                        sorted(missing_documents)
                    )
                ),
            }

        unverified_documents = []

        for document in documents:
            if document.get("doc_type") in required_documents:
                if document.get("verified") is not True:
                    unverified_documents.append(
                        document.get("doc_type")
                    )

        if unverified_documents:
            return {
                "success": False,
                "data": None,
                "error": (
                    "Some documents have not passed "
                    "AI verification: "
                    + ", ".join(
                        unverified_documents
                    )
                ),
            }

        submitted_data = (
            application.get("submitted_data")
            or {}
        )

        if body.scheme is not None:
            submitted_data["scheme"] = body.scheme

        if body.income is not None:
            submitted_data["income"] = body.income

        if body.institution is not None:
            submitted_data["institution"] = body.institution

        if body.course is not None:
            submitted_data["course"] = body.course

        if body.marks is not None:
            submitted_data["marks"] = body.marks
            submitted_data["percentage"] = body.marks

        if current_status == "review":
            new_status = "review"
            note = (
                "Corrected documents submitted after "
                "defect resolution. Application "
                "returned for official review."
            )
        else:
            new_status = "submitted"
            note = (
                "Application finally submitted after "
                "successful AI document verification."
            )

        updated = (
            supabase
            .table("applications")
            .update(
                {
                    "status": new_status,
                    "submitted_data": submitted_data,
                }
            )
            .eq("id", application_id)
            .execute()
        )

        if not updated.data:
            return {
                "success": False,
                "data": None,
                "error": (
                    "Application update affected 0 rows."
                ),
            }

        supabase.table("status_log").insert(
            {
                "application_id": application_id,
                "status": new_status,
                "note": note,
            }
        ).execute()

        return {
            "success": True,
            "data": {
                "application_id": application_id,
                "status": new_status,
            },
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# GET APPLICATION
# ============================================================

@router.get(
    "/applications/{application_id}",
    response_model=ApiResponse,
)
def get_application(
    application_id: str,
) -> ApiResponse:

    try:
        result = evaluate_application(
            application_id
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to evaluate application: {exc}",
        ) from exc

    if not result:
        return ApiResponse(
            success=False,
            data=None,
            error="Application not found",
        )

    return ApiResponse(
        success=True,
        data=ApplicationStatusData(**result),
        error=None,
    )


# ============================================================
# LIST APPLICATIONS
# ============================================================

@router.get("/applications")
async def list_applications(
    status: str | None = None,
):

    try:
        supabase = get_supabase()

        query = (
            supabase
            .table("applications")
            .select(
                "id, status, created_at, "
                "applicant_id, scheme_id, submitted_data, "
                "applicants(name, email), schemes(name)"
            )
        )

        if status:
            query = query.eq("status", status)

        response = query.execute()

        data = []

        for row in response.data or []:

            applicant = row.get("applicants")
            scheme = row.get("schemes")

            if isinstance(applicant, list):
                applicant = (
                    applicant[0]
                    if applicant
                    else None
                )

            if isinstance(scheme, list):
                scheme = (
                    scheme[0]
                    if scheme
                    else None
                )

            submitted_data = (
                row.get("submitted_data")
                or {}
            )

            data.append(
                {
                    "application_id":
                        row.get("id"),

                    "applicant_name":
                        (
                            applicant.get("name")
                            if isinstance(
                                applicant,
                                dict,
                            )
                            else None
                        ),

                    "applicant_email":
                        (
                            applicant.get("email")
                            if isinstance(
                                applicant,
                                dict,
                            )
                            else None
                        ),

                    "scheme_name":
                        (
                            scheme.get("name")
                            if isinstance(
                                scheme,
                                dict,
                            )
                            else None
                        ),

                    "scheme_id":
                        row.get("scheme_id"),

                    "status":
                        row.get("status"),

                    "created_at":
                        row.get("created_at"),

                    "institution":
                        submitted_data.get(
                            "institution"
                        ),

                    "course":
                        submitted_data.get(
                            "course"
                        ),

                    "marks":
                        submitted_data.get(
                            "marks",
                            submitted_data.get(
                                "percentage"
                            ),
                        ),

                    "year":
                        submitted_data.get(
                            "year",
                            "Not available",
                        ),

                    "enrollment_no":
                        submitted_data.get(
                            "enrollment_no",
                            "Not available",
                        ),

                    "attendance":
                        submitted_data.get(
                            "attendance",
                            0,
                        ),

                    "admission_status":
                        submitted_data.get(
                            "admission_status",
                            "Pending",
                        ),

                    "fee_status":
                        submitted_data.get(
                            "fee_status",
                            "Pending",
                        ),
                }
            )

        return {
            "success": True,
            "data": data,
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# OFFICIAL SCRUTINY DECISION
# ============================================================

@router.post(
    "/applications/{application_id}/decision"
)
async def decide_application(
    application_id: str,
    body: DecisionRequest,
):

    try:
        supabase = get_supabase()

        existing = (
            supabase
            .table("applications")
            .select("id, status")
            .eq("id", application_id)
            .execute()
        )

        if not existing.data:
            return {
                "success": False,
                "data": None,
                "error": "Application not found.",
            }

        updated = (
            supabase
            .table("applications")
            .update(
                {
                    "status": body.decision,
                }
            )
            .eq("id", application_id)
            .execute()
        )

        if not updated.data:
            return {
                "success": False,
                "data": None,
                "error": (
                    "Update affected 0 rows."
                ),
            }

        supabase.table("status_log").insert(
            {
                "application_id":
                    application_id,
                "status":
                    body.decision,
                "note":
                    body.admin_note or "",
            }
        ).execute()

        return {
            "success": True,
            "data": {
                "application_id":
                    application_id,
                "status":
                    body.decision,
            },
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# INSTITUTE VERIFICATION
# ============================================================

@router.post(
    "/applications/{application_id}/institute-verification"
)
async def institute_verification(
    application_id: str,
    body: InstituteVerificationRequest,
):

    try:
        supabase = get_supabase()

        existing = (
            supabase
            .table("applications")
            .select(
                "id, status, submitted_data"
            )
            .eq("id", application_id)
            .execute()
        )

        if not existing.data:
            return {
                "success": False,
                "data": None,
                "error": "Application not found.",
            }

        application = existing.data[0]

        submitted_data = (
            application.get(
                "submitted_data"
            )
            or {}
        )

        if body.decision == "verified":

            submitted_data[
                "institute_verified"
            ] = True

            submitted_data[
                "institute_verification_note"
            ] = body.note or (
                "Institution verified enrollment "
                "and academic details."
            )

            new_status = "institute_verified"

        else:

            submitted_data[
                "institute_verified"
            ] = False

            submitted_data[
                "institute_verification_note"
            ] = body.note or (
                "Institution verification requires "
                "further review."
            )

            new_status = "review"

        updated = (
            supabase
            .table("applications")
            .update(
                {
                    "status": new_status,
                    "submitted_data":
                        submitted_data,
                }
            )
            .eq("id", application_id)
            .execute()
        )

        if not updated.data:
            return {
                "success": False,
                "data": None,
                "error": (
                    "Institute verification update "
                    "affected 0 rows."
                ),
            }

        supabase.table("status_log").insert(
            {
                "application_id":
                    application_id,
                "status":
                    new_status,
                "note":
                    body.note or "",
            }
        ).execute()

        return {
            "success": True,
            "data": {
                "application_id":
                    application_id,
                "status":
                    new_status,
                "institute_verified":
                    body.decision == "verified",
            },
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# DBT DISBURSEMENT
# ============================================================

@router.post(
    "/applications/{application_id}/disburse"
)
async def disburse_application(
    application_id: str,
    body: DisbursementRequest,
):

    try:
        supabase = get_supabase()

        existing = (
            supabase
            .table("applications")
            .select(
                "id, status, submitted_data"
            )
            .eq("id", application_id)
            .execute()
        )

        if not existing.data:
            return {
                "success": False,
                "data": None,
                "error": "Application not found.",
            }

        application = existing.data[0]

        current_status = application.get(
            "status"
        )

        submitted_data = (
            application.get(
                "submitted_data"
            )
            or {}
        )

        if (
            submitted_data.get(
                "institute_verified"
            )
            is not True
        ):
            return {
                "success": False,
                "data": None,
                "error": (
                    "Application cannot be disbursed "
                    "until institute verification is "
                    "completed."
                ),
            }

        if current_status != "institute_verified":
            return {
                "success": False,
                "data": None,
                "error": (
                    "Application cannot be disbursed "
                    f"because its current status is "
                    f"'{current_status}'."
                ),
            }

        updated = (
            supabase
            .table("applications")
            .update(
                {
                    "status": "disbursed",
                }
            )
            .eq("id", application_id)
            .execute()
        )

        if not updated.data:
            return {
                "success": False,
                "data": None,
                "error": (
                    "Disbursement update affected "
                    "0 rows."
                ),
            }

        note = (
            body.payment_note
            or
            f"Demo DBT disbursement initiated "
            f"for ₹{body.amount:,.2f}."
        )

        supabase.table("status_log").insert(
            {
                "application_id":
                    application_id,
                "status":
                    "disbursed",
                "note":
                    note,
            }
        ).execute()

        transaction_id = (
            f"DBT-{str(uuid.uuid4())[:8].upper()}"
        )

        return {
            "success": True,
            "data": {
                "application_id":
                    application_id,
                "status":
                    "disbursed",
                "amount":
                    body.amount,
                "transaction_id":
                    transaction_id,
                "message":
                    "Demo DBT payment initiated successfully.",
            },
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# CREATE FELLOWSHIP CLAIM
# ============================================================

@router.post("/fellowship-claims")
async def create_fellowship_claim(
    body: FellowshipClaimRequest,
):

    try:
        supabase = get_supabase()

        result = (
            supabase
            .table("fellowship_claims")
            .insert(
                {
                    "application_id":
                        body.application_id,

                    "student_name":
                        body.student_name,

                    "scheme":
                        body.scheme,

                    "claim_type":
                        body.claim_type,

                    "claim_month":
                        body.claim_month,

                    "amount":
                        body.amount,

                    "remarks":
                        body.remarks,

                    "status":
                        "submitted",
                }
            )
            .execute()
        )

        if not result.data:
            return {
                "success": False,
                "data": None,
                "error":
                    "Failed to create fellowship claim.",
            }

        return {
            "success": True,
            "data": result.data[0],
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# LIST FELLOWSHIP CLAIMS
# ============================================================

@router.get("/fellowship-claims")
async def list_fellowship_claims(
    status: str | None = None,
    scheme: str | None = None,
):

    try:
        supabase = get_supabase()

        query = (
            supabase
            .table("fellowship_claims")
            .select("*")
            .order(
                "created_at",
                desc=True,
            )
        )

        if status:
            query = query.eq(
                "status",
                status,
            )

        if scheme:
            query = query.eq(
                "scheme",
                scheme,
            )

        result = query.execute()

        return {
            "success": True,
            "data":
                result.data or [],
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# FELLOWSHIP CLAIM DECISION
# ============================================================

@router.post(
    "/fellowship-claims/{claim_id}/decision"
)
async def fellowship_claim_decision(
    claim_id: str,
    body: FellowshipDecisionRequest,
):

    try:
        supabase = get_supabase()

        existing = (
            supabase
            .table("fellowship_claims")
            .select("*")
            .eq("id", claim_id)
            .execute()
        )

        if not existing.data:
            return {
                "success": False,
                "data": None,
                "error":
                    "Fellowship claim not found.",
            }

        updated = (
            supabase
            .table("fellowship_claims")
            .update(
                {
                    "status":
                        body.decision,

                    "admin_note":
                        body.admin_note,
                }
            )
            .eq("id", claim_id)
            .execute()
        )

        if not updated.data:
            return {
                "success": False,
                "data": None,
                "error":
                    "Claim update affected 0 rows.",
            }

        return {
            "success": True,
            "data": updated.data[0],
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }


# ============================================================
# FELLOWSHIP CLAIM DISBURSEMENT
# ============================================================

@router.post(
    "/fellowship-claims/{claim_id}/disburse"
)
async def fellowship_claim_disburse(
    claim_id: str,
    body: FellowshipDisbursementRequest,
):

    try:
        supabase = get_supabase()

        existing = (
            supabase
            .table("fellowship_claims")
            .select("*")
            .eq("id", claim_id)
            .execute()
        )

        if not existing.data:
            return {
                "success": False,
                "data": None,
                "error":
                    "Fellowship claim not found.",
            }

        claim = existing.data[0]

        if claim.get("status") != "approved":
            return {
                "success": False,
                "data": None,
                "error": (
                    "Only approved fellowship claims "
                    "can be disbursed."
                ),
            }

        transaction_id = (
            f"FEL-{str(uuid.uuid4())[:8].upper()}"
        )

        note = (
            body.payment_note
            or
            "Demo fellowship DBT payment initiated."
        )

        updated = (
            supabase
            .table("fellowship_claims")
            .update(
                {
                    "status":
                        "disbursed",

                    "transaction_id":
                        transaction_id,

                    "admin_note":
                        note,
                }
            )
            .eq("id", claim_id)
            .execute()
        )

        if not updated.data:
            return {
                "success": False,
                "data": None,
                "error":
                    "Disbursement update failed.",
            }

        return {
            "success": True,
            "data": {
                "claim":
                    updated.data[0],

                "transaction_id":
                    transaction_id,

                "message":
                    "Fellowship DBT payment initiated successfully.",
            },
            "error": None,
        }

    except Exception as exc:
        return {
            "success": False,
            "data": None,
            "error": str(exc),
        }