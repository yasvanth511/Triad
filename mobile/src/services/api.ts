import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants";
import {
  injectTraceHeaders,
  markSpanError,
  markSpanSuccess,
  startSpan,
} from "./otel";
import { SpanKind } from "@opentelemetry/api";

const TOKEN_KEY = "auth_token";

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const method = options.method ?? "GET";
  const span = startSpan(`http.${method.toLowerCase()} ${path}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      "http.request.method": method,
      "url.full": `${API_URL}${path}`,
      "server.address": API_URL,
    },
  });

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const headers = injectTraceHeaders(span, mergeHeaders(baseHeaders, options.headers));

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    span.setAttribute("http.response.status_code", res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const error = new Error(body.error || `Request failed: ${res.status}`);
      markSpanError(span, error);
      throw error;
    }

    markSpanSuccess(span);
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (error) {
    markSpanError(span, error);
    throw error;
  } finally {
    span.end();
  }
}

async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const span = startSpan(`http.post ${path}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      "http.request.method": "POST",
      "url.full": `${API_URL}${path}`,
      "http.request.body.size": formData.getParts?.().length ?? 1,
    },
  });

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: injectTraceHeaders(span, token ? { Authorization: `Bearer ${token}` } : {}),
      body: formData,
    });

    span.setAttribute("http.response.status_code", res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const error = new Error(body.error || `Upload failed: ${res.status}`);
      markSpanError(span, error);
      throw error;
    }

    markSpanSuccess(span);
    return res.json();
  } catch (error) {
    markSpanError(span, error);
    throw error;
  } finally {
    span.end();
  }
}

function mergeHeaders(
  baseHeaders: Record<string, string>,
  headers?: HeadersInit
): Record<string, string> {
  if (!headers) {
    return { ...baseHeaders };
  }

  if (headers instanceof Headers) {
    const merged = { ...baseHeaders };
    headers.forEach((value, key) => {
      merged[key] = value;
    });
    return merged;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((merged, [key, value]) => {
      merged[key] = value;
      return merged;
    }, { ...baseHeaders });
  }

  return {
    ...baseHeaders,
    ...headers,
  };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    uploadFile<T>(path, formData),
};
