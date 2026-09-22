from typing import Any, Literal

EligibilityStatus = Literal["eligible", "ineligible", "review"]


def _normalize_docs(docs: list[str] | None) -> set[str]:
    return {doc.strip().lower() for doc in (docs or []) if doc and str(doc).strip()}


def evaluate_eligibility(
    applicant: dict[str, Any],
    scheme: dict[str, Any] | None,
) -> dict[str, Any]:
    """Compare applicant fields against scheme rules JSONB and required_docs column."""
    scheme = scheme or {}
    rules = scheme.get("rules") or {}
    if not isinstance(rules, dict):
        rules = {}
    trace: list[dict[str, Any]] = []
    hard_fail = False
    needs_review = False

    income_max = rules.get("income_max")
    actual_income = applicant.get("income")
    if income_max is None or actual_income is None:
        income_passed = False
        needs_review = True
    else:
        income_passed = actual_income <= income_max
        if not income_passed:
            hard_fail = True
    trace.append(
        {
            "criterion": "income_max",
            "passed": income_passed,
            "expected": income_max,
            "actual": actual_income,
        }
    )

    min_percentage = rules.get("min_percentage")
    actual_percentage = applicant.get("percentage")
    if min_percentage is None or actual_percentage is None:
        percentage_passed = False
        needs_review = True
    else:
        percentage_passed = actual_percentage >= min_percentage
        if not percentage_passed:
            hard_fail = True
    trace.append(
        {
            "criterion": "min_percentage",
            "passed": percentage_passed,
            "expected": min_percentage,
            "actual": actual_percentage,
        }
    )

    required_docs = scheme.get("required_docs") or []
    if not isinstance(required_docs, list):
        required_docs = list(required_docs)
    submitted_docs = applicant.get("submitted_docs") or []
    missing_docs = _normalize_docs(required_docs) - _normalize_docs(submitted_docs)
    docs_passed = len(missing_docs) == 0
    if not docs_passed:
        needs_review = True
    trace.append(
        {
            "criterion": "required_docs",
            "passed": docs_passed,
            "expected": required_docs,
            "actual": submitted_docs,
        }
    )

    if hard_fail:
        status: EligibilityStatus = "ineligible"
    elif needs_review:
        status = "review"
    else:
        status = "eligible"

    return {"status": status, "trace": trace}
