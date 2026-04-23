import { apiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
};

export async function apiRequest<T>(
  path: string,
  { method = "GET", token, body, query }: RequestOptions = {},
) {
  const url = new URL(
    path.startsWith("/") ? path.slice(1) : path,
    `${apiBaseUrl}/`,
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value == null || value === "") {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = response.statusText;

    try {
      const errorPayload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorPayload.error || errorPayload.message || message;
    } catch {
      // Keep the default status text when the response body is not JSON.
    }

    throw new ApiError(response.status, message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
