import {
  getAuthHeaders,
  getAvatarUrl,
  getInitials,
  normalizeApiUrl,
  TOKEN_STORAGE_KEY,
} from "./Utilities";

describe("shared utility helpers", () => {
  it("builds bearer auth headers only when a token is available", () => {
    expect(getAuthHeaders("test-token")).toEqual({
      Authorization: "Bearer test-token",
    });
    expect(getAuthHeaders("")).toEqual({});
    expect(getAuthHeaders(null)).toEqual({});
  });

  it("derives compact initials with a stable fallback", () => {
    expect(getInitials("AetherStream Admin")).toBe("AA");
    expect(getInitials("  red cow  ")).toBe("RC");
    expect(getInitials("Solo")).toBe("S");
    expect(getInitials("")).toBe("AS");
  });

  it("normalizes optional avatar URLs", () => {
    expect(getAvatarUrl({ avatarUrl: "  https://example.com/avatar.png  " })).toBe(
      "https://example.com/avatar.png"
    );
    expect(getAvatarUrl({})).toBe("");
    expect(getAvatarUrl(null)).toBe("");
  });

  it("uses a stable token storage key", () => {
    expect(TOKEN_STORAGE_KEY).toBe("aetherstream_auth_token");
  });

  it("normalizes API base URLs for route concatenation", () => {
    expect(normalizeApiUrl("https://api.example.com")).toBe(
      "https://api.example.com/"
    );
    expect(normalizeApiUrl(" https://api.example.com/v1/ ")).toBe(
      "https://api.example.com/v1/"
    );
    expect(normalizeApiUrl("")).toBe("http://localhost:8080/");
    expect(normalizeApiUrl(null)).toBe("http://localhost:8080/");
  });
});
