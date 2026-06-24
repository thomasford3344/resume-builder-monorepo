export type BlobDownloadResponse = {
  data: Blob;
  headers: Record<string, string>;
};

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || "";
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {};
  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}

export async function fetchBlobDownload(
  path: string,
  init?: RequestInit,
): Promise<BlobDownloadResponse> {
  const token = localStorage.getItem("access_token");
  const baseURL = getApiBaseUrl();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${baseURL}${path}${separator}_=${Date.now()}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  return {
    data: await response.blob(),
    headers: normalizeHeaders(response.headers),
  };
}

export async function fetchBlobPost(
  path: string,
  body?: unknown,
): Promise<BlobDownloadResponse> {
  const token = localStorage.getItem("access_token");
  const baseURL = getApiBaseUrl();
  const url = `${baseURL}${path}`;

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  return {
    data: await response.blob(),
    headers: normalizeHeaders(response.headers),
  };
}
