from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from paddleocr import PaddleOCR


# ============================================================
# PaddleOCR configuration
# ============================================================

_ocr_engine: PaddleOCR | None = None


def get_ocr_engine() -> PaddleOCR:
    """
    Create the PaddleOCR engine only when it is first needed.

    Lazy loading is important because loading the OCR models
    every time this module is imported would make FastAPI slow.
    """

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
# PDF support
# ============================================================

def pdf_to_images(file_path: str) -> list[str]:
    """
    Convert every page of a PDF into a temporary PNG image.

    PaddleOCR works directly with images, so PDFs are rendered
    before OCR processing.
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
        pdf_path.parent / f"{pdf_path.stem}_ocr_pages"
    )

    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    image_paths: list[str] = []

    document = fitz.open(str(pdf_path))

    try:
        for page_number, page in enumerate(document):
            # Render at a reasonably high resolution.
            # This helps OCR on certificate documents.
            matrix = fitz.Matrix(2.0, 2.0)

            pixmap = page.get_pixmap(
                matrix=matrix,
                alpha=False,
            )

            image_path = (
                output_directory
                / f"page_{page_number + 1}.png"
            )

            pixmap.save(str(image_path))

            image_paths.append(
                str(image_path)
            )

    finally:
        document.close()

    return image_paths


# ============================================================
# PaddleOCR result parsing
# ============================================================

def _convert_to_python(value: Any) -> Any:
    """
    Convert PaddleOCR result objects into normal Python
    dictionaries/lists where possible.
    """

    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, dict):
        return {
            key: _convert_to_python(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            _convert_to_python(item)
            for item in value
        ]

    # PaddleOCR result objects may expose a JSON
    # representation through .json.
    try:
        json_value = getattr(
            value,
            "json",
            None,
        )

        if callable(json_value):
            json_value = json_value()

        if isinstance(json_value, str):
            return json.loads(json_value)

        if isinstance(json_value, dict):
            return _convert_to_python(
                json_value
            )

    except Exception:
        pass

    # Some PaddleOCR result objects expose a
    # dictionary-like representation through .res.
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

    # Last fallback.
    try:
        return dict(value)
    except Exception:
        return str(value)


def _extract_text_from_result(
    result: Any,
) -> list[str]:
    """
    Extract recognized text from one PaddleOCR result.

    PaddleOCR versions can expose OCR output slightly
    differently, so this function handles the common
    result structures.
    """

    data = _convert_to_python(result)

    if not isinstance(data, dict):
        return []

    # Current PaddleOCR structure:
    #
    # {
    #     "res": {
    #         "rec_texts": [...],
    #         "rec_scores": [...]
    #     }
    # }
    inner = data.get("res")

    if isinstance(inner, dict):
        data = inner

    possible_text_keys = [
        "rec_texts",
        "rec_text",
        "texts",
        "text",
    ]

    for key in possible_text_keys:
        value = data.get(key)

        if isinstance(value, list):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        if isinstance(value, str):
            text = value.strip()

            if text:
                return [text]

    # Some result formats may nest OCR data.
    for value in data.values():
        if isinstance(value, dict):
            nested_text = _extract_text_from_result(
                value
            )

            if nested_text:
                return nested_text

    return []


def run_paddle_ocr(
    image_paths: list[str],
) -> str:
    """
    Run PaddleOCR over all document pages and return
    the combined OCR text.
    """

    ocr = get_ocr_engine()

    all_lines: list[str] = []

    for image_path in image_paths:
        try:
            results = ocr.predict(image_path)

            for result in results:
                lines = _extract_text_from_result(
                    result
                )

                all_lines.extend(lines)

        except Exception as exc:
            raise RuntimeError(
                f"PaddleOCR failed for "
                f"{image_path}: {exc}"
            ) from exc

    # Remove accidental duplicate blank lines.
    cleaned_lines = [
        line.strip()
        for line in all_lines
        if line.strip()
    ]

    return "\n".join(cleaned_lines)


# ============================================================
# Text cleanup
# ============================================================

def normalize_text(text: str) -> str:
    """
    Normalize OCR text while keeping useful information.
    """

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

    # Collapse excessive spaces.
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    # Collapse excessive blank lines.
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# ============================================================
# Name extraction
# ============================================================

def extract_name(
    text: str,
) -> str | None:
    """
    Extract a candidate/applicant/student name from OCR text.

    This intentionally uses labels rather than assuming a
    particular student's name.
    """

    patterns = [
        r"(?:candidate|applicant|student|beneficiary)\s*name\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,80})",
        r"(?:name\s+of\s+(?:the\s+)?(?:candidate|applicant|student|beneficiary))\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,80})",
        r"^name\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,80})$",
    ]

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for line in lines:
        for pattern in patterns:
            match = re.search(
                pattern,
                line,
                flags=re.IGNORECASE,
            )

            if match:
                name = match.group(1).strip()

                # Remove trailing certificate labels
                # that OCR may accidentally include.
                name = re.split(
                    r"\b(?:father|mother|dob|date|address|category|caste)\b",
                    name,
                    flags=re.IGNORECASE,
                )[0].strip()

                if len(name) >= 3:
                    return name

    return None


# ============================================================
# Income extraction
# ============================================================

def _parse_money(
    value: str,
) -> float | None:
    """
    Convert OCR-extracted money text to a number.
    """

    cleaned = value.replace(
        ",",
        "",
    )

    cleaned = cleaned.replace(
        "₹",
        "",
    )

    cleaned = cleaned.replace(
        "Rs.",
        "",
    )

    cleaned = cleaned.replace(
        "Rs",
        "",
    )

    cleaned = cleaned.strip()

    # OCR sometimes turns a decimal into a comma.
    cleaned = cleaned.replace(
        " ",
        "",
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


def extract_income(
    text: str,
) -> float | None:
    """
    Extract annual/family income from the OCR text.
    """

    patterns = [
        r"(?:annual\s+family\s+income|family\s+annual\s+income)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)",

        r"(?:annual\s+income)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)",

        r"(?:family\s+income)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)",

        r"(?:income)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)",
    ]

    # Search line by line first.
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

    # Fallback: search the complete text.
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
# Date extraction
# ============================================================

def extract_issue_date(
    text: str,
) -> str | None:
    """
    Extract a likely certificate issue date.
    """

    patterns = [
        r"(?:issue\s+date|date\s+of\s+issue)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",

        r"(?:issued\s+on)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",

        r"(?:issue\s+date|date\s+of\s+issue)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})",
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
# Category extraction
# ============================================================

def extract_category(
    text: str,
) -> str | None:
    """
    Extract a broad category/caste value where a labelled
    category field exists.
    """

    patterns = [
        r"(?:category|caste|community)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{1,50})",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            value = match.group(1).strip()

            # Prevent a following field from becoming part
            # of the extracted category.
            value = re.split(
                r"\b(?:date|dob|address|income|certificate)\b",
                value,
                flags=re.IGNORECASE,
            )[0].strip()

            if value:
                return value

    return None


# ============================================================
# Income comparison
# ============================================================

def compare_income(
    claimed_income: float,
    extracted_income: float | None,
) -> tuple[bool, float, str | None]:
    """
    Compare the student's claimed income with the income
    extracted from the certificate.

    A 5% tolerance is allowed, with a minimum tolerance of
    ₹1,000, to account for small OCR/entry differences.
    """

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
        extracted_income - claimed_income
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
# Main document extraction function
# ============================================================

def extract_from_document(
    file_path: str,
    claimed_income: float = 0,
) -> dict[str, Any]:
    """
    Main OCR function used by routes/documents.py.

    Returns the same structure expected by the existing
    FastAPI document upload workflow.
    """

    document_path = Path(file_path)

    if not document_path.exists():
        raise FileNotFoundError(
            f"Document not found: {file_path}"
        )

    suffix = (
        document_path.suffix
        .lower()
    )

    temporary_images: list[str] = []
    image_paths: list[str] = []

    try:
        # ----------------------------------------------------
        # PDF
        # ----------------------------------------------------

        if suffix == ".pdf":
            image_paths = pdf_to_images(
                file_path
            )

            temporary_images = image_paths

        # ----------------------------------------------------
        # Image
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # OCR
        # ----------------------------------------------------

        raw_text = run_paddle_ocr(
            image_paths
        )

        raw_text = normalize_text(
            raw_text
        )

        # ----------------------------------------------------
        # Field extraction
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Validation
        # ----------------------------------------------------

        if not raw_text.strip():
            return {
                "raw_text": "",
                "extracted_fields": {
                    "name": None,
                    "income": None,
                    "issue_date": None,
                    "category": None,
                },
                "mismatch": True,
                "difference": 0.0,
                "flag_reason": (
                    "No readable text found in the document"
                ),
            }

        mismatch, difference, flag_reason = (
            compare_income(
                claimed_income=claimed_income,
                extracted_income=extracted_income,
            )
        )

        # ----------------------------------------------------
        # Return structure
        # ----------------------------------------------------

        return {
            "raw_text": raw_text,

            "extracted_fields": {
                "name": extracted_name,
                "income": extracted_income,
                "issue_date": issue_date,
                "category": category,
            },

            "mismatch": mismatch,

            "difference": difference,

            "flag_reason": flag_reason,
        }

    finally:
        # ----------------------------------------------------
        # Clean generated PDF page images
        # ----------------------------------------------------

        for image_path in temporary_images:
            try:
                Path(image_path).unlink(
                    missing_ok=True
                )
            except OSError:
                pass

        # Remove generated directory if empty.
        if suffix == ".pdf":
            try:
                output_directory = (
                    document_path.parent
                    / f"{document_path.stem}_ocr_pages"
                )

                output_directory.rmdir()

            except OSError:
                pass