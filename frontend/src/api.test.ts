import { describe, expect, it } from "vitest";
import { normalizeListResponse } from "./api";

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
