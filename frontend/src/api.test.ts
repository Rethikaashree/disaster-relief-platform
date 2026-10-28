import { describe, expect, it } from "vitest";
import { normalizeBaseUrl, normalizeListResponse } from "./api";

describe("normalizeListResponse", () => {
  it("unwraps backend paginated payloads", () => {
    expect(
      normalizeListResponse({ items: [{ id: 1 }, { id: 2 }], total: 2 }),
    ).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("keeps plain arrays unchanged", () => {
    const items = [{ id: 3 }];
    expect(normalizeListResponse(items)).toEqual(items);
  });
});

describe("normalizeBaseUrl", () => {
  it("appends /api if root domain provided without /api", () => {
    expect(
      normalizeBaseUrl("https://disaster-relief-platform-wcpi.onrender.com"),
    ).toBe("https://disaster-relief-platform-wcpi.onrender.com/api");
  });

  it("handles trailing slashes gracefully", () => {
    expect(
      normalizeBaseUrl("https://disaster-relief-platform-wcpi.onrender.com/"),
    ).toBe("https://disaster-relief-platform-wcpi.onrender.com/api");
  });

  it("does not duplicate /api when already present", () => {
    expect(
      normalizeBaseUrl(
        "https://disaster-relief-platform-wcpi.onrender.com/api",
      ),
    ).toBe("https://disaster-relief-platform-wcpi.onrender.com/api");
    expect(
      normalizeBaseUrl(
        "https://disaster-relief-platform-wcpi.onrender.com/api/",
      ),
    ).toBe("https://disaster-relief-platform-wcpi.onrender.com/api");
  });

  it("defaults to /api for relative development mode", () => {
    expect(normalizeBaseUrl(undefined)).toBe("/api");
    expect(normalizeBaseUrl("")).toBe("/api");
    expect(normalizeBaseUrl("/api")).toBe("/api");
  });
});
