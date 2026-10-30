import { describe, expect, it } from "vitest";
import { formatApiError } from "./formatApiError";

describe("formatApiError", () => {
  it("formats string detail properly", () => {
    const error = { response: { data: { detail: "Passwords do not match" } } };
    expect(formatApiError(error)).toBe("Passwords do not match");
  });

  it("formats FastAPI 422 validation array of objects without crashing React", () => {
    const error = {
      response: {
        data: {
          detail: [
            {
              type: "string_too_short",
              loc: ["body", "aadhaar_identifier"],
              msg: "String should have at least 8 characters",
              input: "",
              ctx: { min_length: 8 },
            },
          ],
        },
      },
    };
    expect(formatApiError(error)).toBe("aadhaar_identifier: String should have at least 8 characters");
  });

  it("handles fallback gracefully", () => {
    expect(formatApiError(null, "Fallback message")).toBe("Fallback message");
  });
});
