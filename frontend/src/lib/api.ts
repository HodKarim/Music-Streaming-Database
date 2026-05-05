export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

type RequestOptions = {
  userId?: number;
};

type BodyRequestOptions = RequestOptions & {
  method?: "POST" | "PUT" | "DELETE";
};

function requestHeaders(userId?: number, hasBody = false) {
  const headers: Record<string, string> = {};

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  if (userId) {
    headers["X-User-Id"] = String(userId);
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;

    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // Keep the HTTP status text when the API returns an empty error body.
    }

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function fetchJson<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: requestHeaders(options.userId),
  });

  return parseResponse<T>(response);
}

export async function postJson<TResponse, TBody>(
  path: string,
  body: TBody,
  options: BodyRequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: requestHeaders(options.userId, true),
    method: options.method ?? "POST",
  });

  return parseResponse<TResponse>(response);
}

export async function postEmpty<TResponse>(
  path: string,
  options: BodyRequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: requestHeaders(options.userId),
    method: options.method ?? "POST",
  });

  return parseResponse<TResponse>(response);
}
