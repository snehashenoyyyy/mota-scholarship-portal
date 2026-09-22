from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.eligibility_engine import evaluate_eligibility
from utils.supabase_client import get_scheme

router = APIRouter()


class ApplicantData(BaseModel):
    name: str
    income: float
    percentage: float
    submitted_docs: list[str] = Field(default_factory=list)


class EvaluateEligibilityRequest(BaseModel):
    scheme_id: str
    applicant: ApplicantData


class TraceItem(BaseModel):
    criterion: str
    passed: bool
    expected: object | None = None
    actual: object | None = None


class EligibilityResult(BaseModel):
    status: str
    trace: list[TraceItem]


class ApiResponse(BaseModel):
    success: bool
    data: EligibilityResult | None = None
    error: str | None = None


@router.post("/evaluate-eligibility", response_model=ApiResponse)
def evaluate_eligibility_route(payload: EvaluateEligibilityRequest) -> ApiResponse:
    try:
        scheme = get_scheme(payload.scheme_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch scheme: {exc}") from exc

    if not scheme:
        return ApiResponse(success=False, data=None, error="Scheme not found")

    evaluation = evaluate_eligibility(
        applicant=payload.applicant.model_dump(),
        scheme=scheme,
    )
    return ApiResponse(success=True, data=EligibilityResult(**evaluation), error=None)
