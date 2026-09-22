import os
import re
from typing import Any

import pytesseract
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_PATH"]

_NAME_PATTERN = re.compile(r"name\s*[:\-]\s*(.+)", re.IGNORECASE)
_INCOME_NEAR_LABEL = re.compile(
    r"(?:annual\s*)?income\b.{0,40}?(?:₹|rs\.?)?\s*([\d,]+(?:\.\d+)?)",
    re.IGNORECASE | re.DOTALL,
)
_INCOME_CURRENCY = re.compile(r"(?:₹|rs\.?)\s*([\d,]+(?:\.\d+)?)", re.IGNORECASE)


def _parse_amount(raw: str) -> float:
    return float(raw.replace(",", "").strip())


def extract_name(raw_text: str) -> str | None:
    match = _NAME_PATTERN.search(raw_text)
    if not match:
        return None
    name = match.group(1).strip().splitlines()[0].strip(" .,-")
    return name or None


def extract_income(raw_text: str) -> float | None:
    match = _INCOME_NEAR_LABEL.search(raw_text) or _INCOME_CURRENCY.search(raw_text)
    if not match:
        return None
    try:
        return _parse_amount(match.group(1))
    except ValueError:
        return None


def extract_from_document(image_path: str, claimed_income: int) -> dict[str, Any]:
    raw_text = pytesseract.image_to_string(Image.open(image_path))
    extracted_income = extract_income(raw_text)
    comparison = compare_claimed_income(extracted_income, claimed_income)
    return {
        "raw_text": raw_text,
        "extracted_fields": {
            "name": extract_name(raw_text),
            "income": extracted_income,
        },
        **comparison,
    }


def compare_claimed_income(extracted_income: float | None, claimed_income: int) -> dict[str, Any]:
    if extracted_income is None:
        mismatch = True
        difference = 0
    else:
        difference_value = extracted_income - claimed_income
        mismatch = difference_value != 0
        difference = difference_value if mismatch else 0

    result: dict[str, Any] = {
        "mismatch": mismatch,
        "difference": difference,
    }
    if mismatch:
        result["flag_reason"] = "Certificate income does not match declared income"
    return result
