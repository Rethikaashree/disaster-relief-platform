import { describe, expect, it } from "vitest";
import { parseAadhaarText } from "./aadhaarOcr";

describe("parseAadhaarText", () => {
  it("extracts 12-digit Aadhaar number with spaces", () => {
    const text = `
      Government of India
      Rajesh Kumar
      DOB: 12/05/1985
      Male
      8834 5678 1234
    `;
    const res = parseAadhaarText(text);
    expect(res.aadhaarNumber).toBe("8834 5678 1234");
    expect(res.name).toBe("Rajesh Kumar");
    expect(res.dateOfBirth).toBe("1985-05-12");
    expect(res.gender).toBe("Male");
  });

  it("extracts hyphen-separated Aadhaar number", () => {
    const text = `
      Priya Dharshini
      DOB: 24-11-1992
      Female
      9876-5432-1098
    `;
    const res = parseAadhaarText(text);
    expect(res.aadhaarNumber).toBe("9876 5432 1098");
    expect(res.gender).toBe("Female");
    expect(res.dateOfBirth).toBe("1992-11-24");
  });

  it("handles noisy text gracefully", () => {
    const text = `
      Some noisy OCR text
      4567 8901 2345
      other text
    `;
    const res = parseAadhaarText(text);
    expect(res.aadhaarNumber).toBe("4567 8901 2345");
  });
});
