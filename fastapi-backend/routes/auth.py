from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import auth_service

router = APIRouter()


class SendOtpRequest(BaseModel):
    aadhaar: str


class VerifyOtpRequest(BaseModel):
    aadhaar: str
    otp: str


class OfficialLoginRequest(BaseModel):
    user_id: str
    password: str
    role: str


@router.post("/auth/send-otp")
def send_otp(payload: SendOtpRequest):
    try:
        auth_service.send_otp(payload.aadhaar)
        return {"success": True, "data": {"message": "OTP sent (demo: 123456)"}, "error": None}
    except ValueError as exc:
        return {"success": False, "data": None, "error": str(exc)}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send OTP: {exc}") from exc


@router.post("/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    try:
        result = auth_service.verify_otp(payload.aadhaar, payload.otp)
        return {"success": True, "data": result, "error": None}
    except ValueError as exc:
        return {"success": False, "data": None, "error": str(exc)}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to verify OTP: {exc}") from exc


@router.post("/auth/official-login")
def official_login(payload: OfficialLoginRequest):
    try:
        result = auth_service.official_login(payload.user_id, payload.password, payload.role)
        return {"success": True, "data": result, "error": None}
    except ValueError as exc:
        return {"success": False, "data": None, "error": str(exc)}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed official login: {exc}") from exc