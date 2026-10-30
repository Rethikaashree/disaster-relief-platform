import { createWorker } from "tesseract.js";

export interface ParsedAadhaar {
  aadhaarNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  rawText: string;
}

export function parseAadhaarText(rawText: string): ParsedAadhaar {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let aadhaarNumber = "";
  let dateOfBirth = "";
  let gender = "";
  let name = "";

  const ignoreRegex = /government|india|unique|identification|authority|enrollment|help|uidai|father|mother|husband|address|card|female|male|year|birth|date|dob|mera|aadhaar|pechan/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match 12-digit Aadhaar pattern (e.g. 1234 5678 9012 or 1234-5678-9012)
    const aMatch = line.match(/(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)/);
    if (aMatch && !aadhaarNumber) {
      const cleanDigits = aMatch[1].replace(/\D/g, "");
      if (cleanDigits.length === 12) {
        aadhaarNumber = `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)} ${cleanDigits.slice(8, 12)}`;
      }
    }

    // Match Date of Birth (DD/MM/YYYY or DD-MM-YYYY)
    const dMatch =
      line.match(/(?:dob|birth|date|year)[\s:]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i) ||
      line.match(/\b(?:\d{1,2}[/-]){2}\d{2,4}\b/);
    if (dMatch && !dateOfBirth) {
      const foundDate = dMatch[1] || dMatch[0];
      const parts = foundDate.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // Standardize to YYYY-MM-DD for HTML date input
          dateOfBirth = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else if (parts[0].length === 4) {
          dateOfBirth = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }
      }
    }

    // Match Gender
    const gMatch = line.match(/\b(male|female|other)\b/i);
    if (gMatch && !gender) {
      gender = gMatch[0].charAt(0).toUpperCase() + gMatch[0].slice(1).toLowerCase();
    }

    // Extract name - usually the line directly preceding the DOB line that isn't a government header
    if (/dob|birth/i.test(line) && !name && i > 0) {
      for (let j = i - 1; j >= 0; j--) {
        const candidate = lines[j].replace(/[^a-zA-Z\s]/g, "").trim();
        if (candidate.length >= 3 && !ignoreRegex.test(candidate)) {
          name = candidate;
          break;
        }
      }
    }
  }

  // Fallback: If aadhaar wasn't found line by line, search across the full text
  if (!aadhaarNumber) {
    const fullMatch = rawText.match(/(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)/);
    if (fullMatch) {
      const cleanDigits = fullMatch[1].replace(/\D/g, "");
      if (cleanDigits.length === 12) {
        aadhaarNumber = `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)} ${cleanDigits.slice(8, 12)}`;
      }
    }
  }

  return {
    aadhaarNumber,
    name,
    dateOfBirth,
    gender,
    rawText,
  };
}

let workerInstance: any = null;

export async function scanAadhaarImage(
  imageSource: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedAadhaar> {
  try {
    if (!workerInstance) {
      workerInstance = await createWorker("eng");
    }

    const ret = await workerInstance.recognize(imageSource);
    const text = ret?.data?.text || "";
    return parseAadhaarText(text);
  } catch (err) {
    console.warn("Client-side OCR failed or timed out:", err);
    throw err;
  }
}
