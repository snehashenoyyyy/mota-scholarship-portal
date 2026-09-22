from typing import Any

from services.eligibility_engine import evaluate_eligibility
from utils.supabase_client import get_scheme, get_supabase


def apply_for_scheme(
    applicant_name: str,
    applicant_email: str,
    scheme_id: str,
    income: float,
    percentage: float,
) -> str:
    supabase = get_supabase()

    existing = (
        supabase
        .table("applicants")
        .select("id")
        .eq("email", applicant_email)
        .execute()
    )

    if existing.data:
        applicant_id = existing.data[0]["id"]
    else:
        created = (
            supabase
            .table("applicants")
            .insert(
                {
                    "name": applicant_name,
                    "email": applicant_email,
                }
            )
            .execute()
        )

        if not created.data:
            raise RuntimeError("Failed to create applicant")

        applicant_id = created.data[0]["id"]

    created_application = (
        supabase
        .table("applications")
        .insert(
            {
                "applicant_id": applicant_id,
                "scheme_id": scheme_id,
                "status": "submitted",
                "submitted_data": {
                    "income": income,
                    "percentage": percentage,
                },
            }
        )
        .execute()
    )

    if not created_application.data:
        raise RuntimeError("Failed to create application")

    return created_application.data[0]["id"]


def evaluate_application(
    application_id: str,
) -> dict[str, Any] | None:
    supabase = get_supabase()

    application_result = (
        supabase
        .table("applications")
        .select("*")
        .eq("id", application_id)
        .execute()
    )

    if not application_result.data:
        return None

    application = application_result.data[0]
    current_status = application.get("status")

    documents_result = (
        supabase
        .table("documents")
        .select("*")
        .eq("application_id", application_id)
        .execute()
    )

    documents = documents_result.data or []

    # These statuses represent stages that have already been
    # decided by the workflow. The eligibility engine must not
    # overwrite them.
    protected_statuses = {
        "approved",
        "rejected",
        "disbursed",
        "review",
        "institute_verified",
    }

    if current_status in protected_statuses:
        eligibility_result = (
            application.get("eligibility_result") or {}
        )

        trace = eligibility_result.get(
            "trace",
            [],
        )

        return {
            "status": current_status,
            "trace": trace,
            "documents": documents,
        }

    scheme = get_scheme(
        application["scheme_id"]
    )

    if not scheme:
        raise RuntimeError(
            "Scheme not found"
        )

    submitted_data = (
        application.get("submitted_data")
        or {}
    )

    submitted_docs = [
        doc.get("doc_type")
        for doc in documents
        if doc.get("doc_type")
    ]

    evaluation = evaluate_eligibility(
        applicant={
            "income": submitted_data.get(
                "income"
            ),
            "percentage": submitted_data.get(
                "percentage"
            ),
            "submitted_docs": submitted_docs,
        },
        scheme=scheme,
    )

    (
        supabase
        .table("applications")
        .update(
            {
                "status": evaluation["status"],
                "eligibility_result": evaluation,
            }
        )
        .eq("id", application_id)
        .execute()
    )

    return {
        "status": evaluation["status"],
        "trace": evaluation["trace"],
        "documents": documents,
    }


def save_document(
    application_id: str,
    doc_type: str,
    extracted_data: dict[str, Any],
    verified: bool,
    file_url: str | None = None,
) -> dict[str, Any]:
    supabase = get_supabase()

    # Replace the previous version of the same document.
    # This prevents duplicate document rows when a student
    # corrects and re-uploads a flagged document.
    (
        supabase
        .table("documents")
        .delete()
        .eq(
            "application_id",
            application_id,
        )
        .eq(
            "doc_type",
            doc_type,
        )
        .execute()
    )

    result = (
        supabase
        .table("documents")
        .insert(
            {
                "application_id": application_id,
                "doc_type": doc_type,
                "extracted_data": extracted_data,
                "verified": verified,
                "file_url": file_url,
            }
        )
        .execute()
    )

    if not result.data:
        raise RuntimeError(
            "Failed to save document"
        )

    return result.data[0]