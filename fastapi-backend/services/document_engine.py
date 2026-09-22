from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from paddleocr import PaddleOCR


# ============================================================
# OCR ENGINE
# ============================================================

_ocr_engine: PaddleOCR | None = None

_OCR_CACHE: dict[str, str] = {}
_OCR_CACHE_MAX = 20


def get_ocr_engine() -> PaddleOCR:
    global _ocr_engine

    if _ocr_engine is None:
        _ocr_engine = PaddleOCR(
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            engine="paddle",
        )

    return _ocr_engine


# ============================================================
# CACHE
# ============================================================

def _file_hash(file_path: str) -> str:
    sha = hashlib.sha256()

    with open(file_path, "rb") as file:
        while True:
            chunk = file.read(1024 * 1024)

            if not chunk:
                break

            sha.update(chunk)

    return sha.hexdigest()


def _get_cached_ocr(file_path: str) -> str | None:
    try:
        key = _file_hash(file_path)
        return _OCR_CACHE.get(key)
    except Exception:
        return None


def _set_cached_ocr(
    file_path: str,
    text: str,
) -> None:
    try:
        key = _file_hash(file_path)

        if len(_OCR_CACHE) >= _OCR_CACHE_MAX:
            oldest_key = next(iter(_OCR_CACHE))
            _OCR_CACHE.pop(oldest_key, None)

        _OCR_CACHE[key] = text

    except Exception:
        pass


# ============================================================
# PDF NATIVE TEXT EXTRACTION
# ============================================================

def extract_pdf_text(
    file_path: str,
) -> str:
    """
    Try extracting text directly from the PDF.

    This is much faster than OCR and works extremely well
    for digitally generated certificates and demo PDFs.
    """

    try:
        import fitz
    except ImportError as exc:
        raise RuntimeError(
            "PDF processing requires PyMuPDF. "
            "Run: python -m pip install pymupdf"
        ) from exc

    document = fitz.open(file_path)

    try:
        pages: list[str] = []

        for page in document:
            text = page.get_text("text")

            if text:
                pages.append(text)

        return "\n".join(pages).strip()

    finally:
        document.close()


def has_useful_text(text: str) -> bool:
    """
    Decide whether native PDF text is sufficient.

    We require a reasonable amount of readable text.
    """

    if not text:
        return False

    cleaned = normalize_text(text)

    if len(cleaned) < 25:
        return False

    letters = len(
        re.findall(
            r"[A-Za-z]",
            cleaned,
        )
    )

    return letters >= 10


# ============================================================
# PDF -> IMAGE
# ============================================================

def pdf_to_images(
    file_path: str,
) -> list[str]:
    """
    Render PDF pages only when native PDF text extraction
    is not sufficient.
    """

    try:
        import fitz
    except ImportError as exc:
        raise RuntimeError(
            "PDF OCR requires PyMuPDF. "
            "Run: python -m pip install pymupdf"
        ) from exc

    pdf_path = Path(file_path)

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"Document not found: {file_path}"
        )

    output_directory = (
        pdf_path.parent
        / f"{pdf_path.stem}_ocr_pages"
    )

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    image_paths: list[str] = []

    document = fitz.open(str(pdf_path))

    try:
        # Lower resolution than before.
        # Native text extraction is attempted first,
        # so this is only used for scanned PDFs.
        matrix = fitz.Matrix(
            1.35,
            1.35,
        )

        for page_number, page in enumerate(document):

            pixmap = page.get_pixmap(
                matrix=matrix,
                alpha=False,
            )

            image_path = (
                output_directory
                / f"page_{page_number + 1}.png"
            )

            pixmap.save(
                str(image_path)
            )

            image_paths.append(
                str(image_path)
            )

    finally:
        document.close()

    return image_paths


# ============================================================
# PADDLE RESULT CONVERSION
# ============================================================

def _convert_to_python(
    value: Any,
) -> Any:

    if value is None:
        return None

    if isinstance(
        value,
        (
            str,
            int,
            float,
            bool,
        ),
    ):
        return value

    if isinstance(value, dict):
        return {
            key: _convert_to_python(item)
            for key, item in value.items()
        }

    if isinstance(
        value,
        (list, tuple),
    ):
        return [
            _convert_to_python(item)
            for item in value
        ]

    try:
        json_value = getattr(
            value,
            "json",
            None,
        )

        if callable(json_value):
            json_value = json_value()

        if isinstance(
            json_value,
            str,
        ):
            return json.loads(
                json_value
            )

        if isinstance(
            json_value,
            dict,
        ):
            return _convert_to_python(
                json_value
            )

    except Exception:
        pass

    try:
        res_value = getattr(
            value,
            "res",
            None,
        )

        if res_value is not None:
            return _convert_to_python(
                res_value
            )

    except Exception:
        pass

    try:
        return dict(value)

    except Exception:
        return str(value)


def _extract_text_from_result(
    result: Any,
) -> list[str]:

    data = _convert_to_python(
        result
    )

    if not isinstance(
        data,
        dict,
    ):
        return []

    inner = data.get("res")

    if isinstance(
        inner,
        dict,
    ):
        data = inner

    possible_keys = [
        "rec_texts",
        "rec_text",
        "texts",
        "text",
    ]

    for key in possible_keys:

        value = data.get(key)

        if isinstance(
            value,
            list,
        ):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        if isinstance(
            value,
            str,
        ):
            value = value.strip()

            if value:
                return [value]

    for value in data.values():

        if isinstance(
            value,
            dict,
        ):
            nested = _extract_text_from_result(
                value
            )

            if nested:
                return nested

    return []


# ============================================================
# PADDLE OCR
# ============================================================

def run_paddle_ocr(
    image_paths: list[str],
) -> str:

    if not image_paths:
        return ""

    # OCR cache is handled at document level.

    ocr = get_ocr_engine()

    all_lines: list[str] = []

    for image_path in image_paths:

        try:
            results = ocr.predict(
                image_path
            )

            for result in results:

                lines = _extract_text_from_result(
                    result
                )

                all_lines.extend(
                    lines
                )

        except Exception as exc:

            raise RuntimeError(
                f"PaddleOCR failed for "
                f"{image_path}: {exc}"
            ) from exc

    cleaned_lines = [
        line.strip()
        for line in all_lines
        if line.strip()
    ]

    return "\n".join(
        cleaned_lines
    )


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(
    text: str,
) -> str:

    text = text.replace(
        "\u00a0",
        " ",
    )

    text = text.replace(
        "\r\n",
        "\n",
    )

    text = text.replace(
        "\r",
        "\n",
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# ============================================================
# NAME
# ============================================================

def clean_name(
    value: str,
) -> str | None:

    value = value.strip()

    value = re.split(
        r"\b(?:father|mother|dob|date|address|"
        r"category|caste|community|income|"
        r"certificate|district|state)\b",
        value,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip()

    value = re.sub(
        r"^[\s:.\-]+",
        "",
        value,
    ).strip()

    if not re.fullmatch(
        r"[A-Za-z][A-Za-z .'\-]{2,80}",
        value,
    ):
        return None

    return value


def extract_name(
    text: str,
) -> str | None:

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    patterns = [

        r"(?:candidate|applicant|student|beneficiary)"
        r"\s+name\s*[:\-]\s*(.+)$",

        r"name\s+of\s+(?:the\s+)?"
        r"(?:candidate|applicant|student|beneficiary)"
        r"\s*[:\-]\s*(.+)$",

        r"^name\s*[:\-]\s*(.+)$",
    ]

    for line in lines:

        for pattern in patterns:

            match = re.search(
                pattern,
                line,
                flags=re.IGNORECASE,
            )

            if match:

                name = clean_name(
                    match.group(1)
                )

                if name:
                    return name

    label_patterns = [
        r"^(?:candidate|applicant|student|beneficiary)\s+name$",
        r"^name\s+of\s+(?:the\s+)?(?:candidate|applicant|student|beneficiary)$",
        r"^name$",
    ]

    for index, line in enumerate(lines):

        for pattern in label_patterns:

            if re.fullmatch(
                pattern,
                line,
                flags=re.IGNORECASE,
            ):

                if index + 1 < len(lines):

                    candidate = clean_name(
                        lines[index + 1]
                    )

                    if candidate:
                        return candidate

    return None


# ============================================================
# MONEY
# ============================================================

def _parse_money(
    value: str,
) -> float | None:

    cleaned = value

    cleaned = cleaned.replace(
        ",",
        "",
    )

    cleaned = cleaned.replace(
        "₹",
        "",
    )

    cleaned = re.sub(
        r"\b(?:Rs\.?|INR)\b",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    match = re.search(
        r"\d+(?:\.\d+)?",
        cleaned,
    )

    if not match:
        return None

    try:
        return float(
            match.group(0)
        )

    except ValueError:
        return None


# ============================================================
# INCOME
# ============================================================

def extract_income(
    text: str,
) -> float | None:

    patterns = [

        r"(?:annual\s+family\s+income|"
        r"family\s+annual\s+income)"
        r"\s*[:\-]?\s*"
        r"(?:₹|rs\.?|inr)?\s*"
        r"([\d,]+(?:\.\d+)?)",

        r"(?:annual\s+income)"
        r"\s*[:\-]?\s*"
        r"(?:₹|rs\.?|inr)?\s*"
        r"([\d,]+(?:\.\d+)?)",

        r"(?:family\s+income)"
        r"\s*[:\-]?\s*"
        r"(?:₹|rs\.?|inr)?\s*"
        r"([\d,]+(?:\.\d+)?)",

        r"(?:income)"
        r"\s*[:\-]?\s*"
        r"(?:₹|rs\.?|inr)?\s*"
        r"([\d,]+(?:\.\d+)?)",
    ]

    for line in text.splitlines():

        line = line.strip()

        if not line:
            continue

        for pattern in patterns:

            match = re.search(
                pattern,
                line,
                flags=re.IGNORECASE,
            )

            if match:

                value = _parse_money(
                    match.group(1)
                )

                if value is not None:
                    return value

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:

            value = _parse_money(
                match.group(1)
            )

            if value is not None:
                return value

    return None


# ============================================================
# ISSUE DATE
# ============================================================

def extract_issue_date(
    text: str,
) -> str | None:

    patterns = [

        r"(?:issue\s+date|date\s+of\s+issue)"
        r"\s*[:\-]?\s*"
        r"(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",

        r"(?:issued\s+on)"
        r"\s*[:\-]?\s*"
        r"(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",

        r"(?:issue\s+date|date\s+of\s+issue)"
        r"\s*[:\-]?\s*"
        r"(\d{1,2}\s+[A-Za-z]+\s+\d{4})",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

    return None


# ============================================================
# CATEGORY
# ============================================================

def clean_category(
    value: str,
) -> str | None:

    value = value.strip()

    value = re.split(
        r"\b(?:date|dob|address|income|certificate|"
        r"district|state)\b",
        value,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip()

    value = re.sub(
        r"^[\s:.\-]+",
        "",
        value,
    ).strip()

    if len(value) < 2:
        return None

    return value


def extract_category(
    text: str,
) -> str | None:

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    same_line = (
        r"(?:category|caste|community)"
        r"\s*[:\-]\s*(.+)$"
    )

    for line in lines:

        match = re.search(
            same_line,
            line,
            flags=re.IGNORECASE,
        )

        if match:

            value = clean_category(
                match.group(1)
            )

            if value:
                return value

    for index, line in enumerate(lines):

        if re.fullmatch(
            r"(?:category|caste|community)",
            line,
            flags=re.IGNORECASE,
        ):

            if index + 1 < len(lines):

                value = clean_category(
                    lines[index + 1]
                )

                if value:
                    return value

    patterns = [
        r"(scheduled\s+tribe(?:\s*\(\s*st\s*\))?)",
        r"(\bST\b)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

    return None


# ============================================================
# PERCENTAGE
# ============================================================

def extract_percentage(
    text: str,
) -> float | None:

    patterns = [

        r"(?:percentage|percent|aggregate|overall)"
        r"\s*[:\-]?\s*"
        r"(\d+(?:\.\d+)?)\s*%",

        r"(\d+(?:\.\d+)?)\s*%",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:

            try:
                value = float(
                    match.group(1)
                )

                if 0 <= value <= 100:
                    return value

            except ValueError:
                pass

    return None


# ============================================================
# CGPA
# ============================================================

def extract_cgpa(
    text: str,
) -> float | None:

    patterns = [

        r"(?:cgpa|c\.g\.p\.a\.?)"
        r"\s*[:\-]?\s*"
        r"(\d+(?:\.\d+)?)",

        r"(?:gpa)"
        r"\s*[:\-]?\s*"
        r"(\d+(?:\.\d+)?)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:

            try:
                value = float(
                    match.group(1)
                )

                if 0 <= value <= 10:
                    return value

            except ValueError:
                pass

    return None


# ============================================================
# DOCUMENT SIGNALS
# ============================================================

def detect_document_signals(
    text: str,
) -> dict[str, bool]:

    normalized = text.lower()

    return {

        "looks_like_income_certificate": any(
            phrase in normalized
            for phrase in [
                "income certificate",
                "annual family income",
                "annual income",
                "family income",
            ]
        ),

        "looks_like_caste_certificate": any(
            phrase in normalized
            for phrase in [
                "caste certificate",
                "scheduled tribe",
                "scheduled tribes",
                "community certificate",
                "tribe certificate",
            ]
        ),

        "looks_like_marksheet": any(
            phrase in normalized
            for phrase in [
                "marksheet",
                "mark sheet",
                "marks statement",
                "percentage",
                "aggregate",
                "examination",
                "result",
            ]
        ),

        "looks_like_admission_document": any(
            phrase in normalized
            for phrase in [
                "admission",
                "offer letter",
                "admission letter",
                "enrollment",
                "enrolment",
                "bonafide",
            ]
        ),

        "looks_like_domicile": any(
            phrase in normalized
            for phrase in [
                "domicile",
                "residence certificate",
                "permanent residence",
            ]
        ),
    }


# ============================================================
# INCOME COMPARISON
# ============================================================

def compare_income(
    claimed_income: float,
    extracted_income: float | None,
) -> tuple[bool, float, str | None]:

    if extracted_income is None:

        return (
            True,
            0.0,
            "Annual income could not be extracted from the certificate",
        )

    if claimed_income <= 0:

        return (
            False,
            0.0,
            None,
        )

    difference = abs(
        extracted_income
        - claimed_income
    )

    tolerance = max(
        1000.0,
        claimed_income * 0.05,
    )

    if difference > tolerance:

        return (
            True,
            difference,
            (
                "Income mismatch: "
                f"claimed ₹{claimed_income:,.0f}, "
                f"certificate shows "
                f"₹{extracted_income:,.0f}"
            ),
        )

    return (
        False,
        difference,
        None,
    )


# ============================================================
# MAIN DOCUMENT ENGINE
# ============================================================

def extract_from_document(
    file_path: str,
    claimed_income: float = 0,
) -> dict[str, Any]:

    document_path = Path(
        file_path
    )

    if not document_path.exists():
        raise FileNotFoundError(
            f"Document not found: {file_path}"
        )

    suffix = document_path.suffix.lower()

    generated_images: list[str] = []

    try:

        # ====================================================
        # CACHE CHECK
        # ====================================================

        cached_text = _get_cached_ocr(
            file_path
        )

        if cached_text is not None:

            raw_text = normalize_text(
                cached_text
            )

        else:

            raw_text = ""

            # =================================================
            # PDF: TRY NATIVE TEXT FIRST
            # =================================================

            if suffix == ".pdf":

                try:

                    native_text = extract_pdf_text(
                        file_path
                    )

                    native_text = normalize_text(
                        native_text
                    )

                    if has_useful_text(
                        native_text
                    ):
                        raw_text = native_text

                except Exception:
                    raw_text = ""

            # =================================================
            # IMAGE / SCANNED PDF -> PADDLE OCR
            # =================================================

            if not raw_text:

                if suffix == ".pdf":

                    image_paths = pdf_to_images(
                        file_path
                    )

                    generated_images = image_paths

                elif suffix in {
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".webp",
                    ".bmp",
                    ".tif",
                    ".tiff",
                }:

                    image_paths = [
                        str(document_path)
                    ]

                else:

                    raise ValueError(
                        "Unsupported document type. "
                        "Please upload PDF, PNG, JPG, JPEG, "
                        "WEBP, BMP, TIFF or TIF."
                    )

                raw_text = run_paddle_ocr(
                    image_paths
                )

                raw_text = normalize_text(
                    raw_text
                )

            _set_cached_ocr(
                file_path,
                raw_text,
            )

        # ====================================================
        # NO TEXT
        # ====================================================

        if not raw_text.strip():

            return {
                "raw_text": "",

                "extracted_fields": {
                    "name": None,
                    "income": None,
                    "issue_date": None,
                    "category": None,
                    "percentage": None,
                    "cgpa": None,
                },

                "mismatch": True,

                "difference": 0.0,

                "flag_reason": (
                    "No readable text found "
                    "in the document"
                ),

                "document_signals": {},
            }

        # ====================================================
        # FIELD EXTRACTION
        # ====================================================

        extracted_name = extract_name(
            raw_text
        )

        extracted_income = extract_income(
            raw_text
        )

        issue_date = extract_issue_date(
            raw_text
        )

        category = extract_category(
            raw_text
        )

        percentage = extract_percentage(
            raw_text
        )

        cgpa = extract_cgpa(
            raw_text
        )

        document_signals = (
            detect_document_signals(
                raw_text
            )
        )

        # ====================================================
        # INCOME VALIDATION
        # ====================================================

        mismatch = False
        difference = 0.0
        flag_reason = None

        if (
            extracted_income is not None
            and claimed_income > 0
        ):

            (
                mismatch,
                difference,
                flag_reason,
            ) = compare_income(
                claimed_income=claimed_income,
                extracted_income=extracted_income,
            )

        # ====================================================
        # RETURN
        # ====================================================

        return {

            "raw_text": raw_text,

            "extracted_fields": {
                "name": extracted_name,
                "income": extracted_income,
                "issue_date": issue_date,
                "category": category,
                "percentage": percentage,
                "cgpa": cgpa,
            },

            "mismatch": mismatch,

            "difference": difference,

            "flag_reason": flag_reason,

            "document_signals": document_signals,
        }

    finally:

        # ====================================================
        # CLEAN OCR TEMP FILES
        # ====================================================

        for image_path in generated_images:

            try:

                Path(
                    image_path
                ).unlink(
                    missing_ok=True
                )

            except OSError:
                pass

        if suffix == ".pdf":

            try:

                output_directory = (
                    document_path.parent
                    / f"{document_path.stem}_ocr_pages"
                )

                output_directory.rmdir()

            except OSError:
                pass