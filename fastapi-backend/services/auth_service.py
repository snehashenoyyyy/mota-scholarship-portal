"""
Auth logic: student (Aadhaar + mock OTP + mock e-KYC) and official
(user id + password + role) login. Sessions are opaque tokens stored in
Supabase, not JWTs — simpler for a hackathon demo.
"""

from datetime import datetime, timedelta, timezone

import bcrypt

from utils.supabase_client import get_supabase
from utils.verhoeff import is_valid_aadhaar_format

MOCK_OTP = "123456"


def send_otp(aadhaar: str) -> None:
    if not is_valid_aadhaar_format(aadhaar):
        raise ValueError("Invalid Aadhaar number")

    supabase = get_supabase()
    row = (
        supabase.table("mock_aadhaar_kyc")
        .select("aadhaar")
        .eq("aadhaar", aadhaar)
        .execute()
    )
    if not row.data:
        raise ValueError("Aadhaar not found in mock KYC records")

    # Real flow: call UIDAI/DigiLocker e-KYC OTP API here.
    # Demo flow: OTP is always MOCK_OTP, nothing is actually sent.
    return None


def verify_otp(aadhaar: str, otp: str) -> dict:
    if otp != MOCK_OTP:
        raise ValueError("Incorrect OTP")

    supabase = get_supabase()
    kyc = (
        supabase.table("mock_aadhaar_kyc")
        .select("*")
        .eq("aadhaar", aadhaar)
        .single()
        .execute()
    )
    if not kyc.data:
        raise ValueError("Aadhaar not found in mock KYC records")

    applicant = (
        supabase.table("applicants")
        .select("id")
        .eq("aadhaar", aadhaar)
        .execute()
    )
    is_returning = bool(applicant.data)
    applicant_id = applicant.data[0]["id"] if is_returning else None

    token = _create_session(
        subject_type="applicant",
        subject_id=applicant_id or aadhaar,
        role=None,
    )

    return {
        "token": token,
        "is_returning": is_returning,
        "applicant_id": applicant_id,
        "name": kyc.data["name"],
        "dob": kyc.data["dob"],
        "gender": kyc.data["gender"],
    }


def official_login(user_id: str, password: str, role: str) -> dict:
    supabase = get_supabase()
    official = (
        supabase.table("officials")
        .select("*")
        .eq("user_id", user_id)
        .eq("role", role)
        .execute()
    )
    if not official.data:
        raise ValueError("Invalid user ID, role, or password")

    record = official.data[0]
    if not bcrypt.checkpw(password.encode(), record["password_hash"].encode()):
        raise ValueError("Invalid user ID, role, or password")

    token = _create_session(
        subject_type="official",
        subject_id=record["id"],
        role=record["role"],
    )

    return {
        "token": token,
        "official_id": record["id"],
        "name": record.get("name"),
        "role": record["role"],
    }


def _create_session(subject_type: str, subject_id: str, role: str | None) -> str:
    supabase = get_supabase()
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
    result = (
        supabase.table("sessions")
        .insert({
            "subject_type": subject_type,
            "subject_id": subject_id,
            "role": role,
            "expires_at": expires_at,
        })
        .execute()
    )
    return result.data[0]["token"]