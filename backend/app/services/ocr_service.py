import hashlib
from io import BytesIO
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any
import cv2
import numpy as np
import PIL.Image as Image
import pytesseract
from fastapi import UploadFile
from ..config import settings

SUPPORTED_EXTENSIONS = settings.allowed_extensions


def validate_document(upload: UploadFile) -> tuple[Path, str]:
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError("Please upload a valid JPG, PNG or PDF.")
    if upload.file is None:
        raise ValueError("The uploaded document is empty.")
    content = upload.file.read(settings.max_upload_bytes + 1)
    if not content:
        raise ValueError("The uploaded document is empty.")
    if len(content) > settings.max_upload_bytes:
        raise ValueError("The uploaded document exceeds the maximum allowed size.")
    if suffix == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise ValueError("The uploaded file is not a valid PDF document.")
    else:
        try:
            with Image.open(BytesIO(content)) as image:
                image.verify()
        except (OSError, ValueError, SyntaxError) as exc:
            raise ValueError("The uploaded file is not a valid image.") from exc
    return Path(suffix), content


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(__import__("io").BytesIO(image_bytes))
    image = image.convert("RGB")
    array = np.asarray(image)
    if array.size == 0 or array.shape[0] < 20 or array.shape[1] < 20:
        raise ValueError("The document is too small or unreadable.")
    gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY)
    gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY)
    gray = cv2.bilateralFilter(gray, 5, 15, 10)
    gray = cv2.convertScaleAbs(gray)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    gray = cv2.morphologyEx(gray, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return gray


def extract_text(image_bytes: bytes) -> str:
    processed = preprocess_image(image_bytes)
    try:
        text = pytesseract.image_to_string(processed, config="--psm 6", lang="eng")
    except (OSError, subprocess.SubprocessError) as exc:
        raise RuntimeError("Tesseract OCR is unavailable or could not process the document.") from exc
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        raise ValueError("Unable to extract sufficient information. Please try again or enter details manually.")
    return text


def normalize_identifier(value: str) -> str:
    return re.sub(r"\s+|[- ]", "", value).upper()


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def mask_aadhaar(value: str) -> str:
    cleaned = re.sub(r"\D", "", value)
    if len(cleaned) >= 4:
        return f"XXXX XXXX {cleaned[-4:]}"
    return "MASKED"


def aadhaar_hash(value: str) -> str:
    return hashlib.sha256(normalize_identifier(value).encode("utf-8")).hexdigest()


def parse_aadhaar_fields(raw_text: str) -> dict[str, Any]:
    text = re.sub(r"\s+", " ", raw_text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name_candidates = []
    dob_candidates = []
    gender_candidates = []
    aadhaar_candidates = []

    for line in lines:
        aadhaar_match = re.search(r"(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)", line)
        if aadhaar_match:
            aadhaar_candidates.append(aadhaar_match.group(1).replace(" ", "-"))
        date_match = re.search(r"\b(?:\d{1,2}[/-]){2}\d{2,4}\b", line)
        if date_match:
            dob_candidates.append(date_match.group(0))
        gender_match = re.search(r"\b(?:male|female|other)\b", line, re.IGNORECASE)
        if gender_match:
            gender_candidates.append(gender_match.group(0).capitalize())
        if re.search(r"name", line, re.IGNORECASE) and len(line) > 4:
            name_candidates.append(line)

    name = ""
    for candidate in name_candidates:
        cleaned = re.sub(r"^(name|cardholder|uid|aadhaar|holder)\s*[:\-]?\s*", "", candidate, flags=re.IGNORECASE)
        if cleaned and len(cleaned) > 4:
            name = cleaned
            break
    if not name:
        name = ""

    dob = next((value for value in dob_candidates if len(value) >= 8), "")
    gender = next((value for value in gender_candidates if value in {"Male", "Female", "Other"}), "")
    aadhaar = next((value for value in aadhaar_candidates if re.sub(r"\D", "", value) and len(re.sub(r"\D", "", value)) == 12), "")
    return {
        "name": name,
        "date_of_birth": dob,
        "gender": gender,
        "aadhaar_identifier": aadhaar,
    }


def process_document(content: bytes, file_name: str) -> dict[str, Any]:
    if file_name.lower().endswith(".pdf"):
        raise ValueError("PDF OCR is not available. Upload a JPG or PNG image.")
    raw_text = extract_text(content)
    return parse_aadhaar_fields(raw_text)
