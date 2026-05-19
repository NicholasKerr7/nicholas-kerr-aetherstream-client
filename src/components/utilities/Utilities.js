export const DEFAULT_API_URL = "http://localhost:8080/";
export const normalizeApiUrl = (url = DEFAULT_API_URL) => {
  const trimmedUrl = String(url || "").trim();
  const resolvedUrl = trimmedUrl || DEFAULT_API_URL;

  return resolvedUrl.endsWith("/") ? resolvedUrl : `${resolvedUrl}/`;
};
export const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);
export const TOKEN_STORAGE_KEY = "aetherstream_auth_token";

export const getAuthHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

export const getInitials = (fullName = "") => {
  const cleaned = fullName.trim();

  if (!cleaned) {
    return "AS";
  }

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
};

export const getAvatarUrl = (user) => user?.avatarUrl?.trim() || "";
