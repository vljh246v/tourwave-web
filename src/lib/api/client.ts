import { ApiError, mapErrorMessage } from "./errors";
import type { paths } from "./schema";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Registered by AuthProvider on mount to trigger refresh/logout on 401.
let onUnauthorized: (() => Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<void>) | null): void {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (WRITE_METHODS.has(method)) {
    headers["Idempotency-Key"] = crypto.randomUUID();
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    if (onUnauthorized !== null) {
      await onUnauthorized().catch(() => null);
    }
    throw new ApiError(401, "UNAUTHORIZED", mapErrorMessage(401, "UNAUTHORIZED"));
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { code: "UNKNOWN", message: "" } }));
    const code: string = (err as { error?: { code?: string } }).error?.code ?? "UNKNOWN";
    const msg: string =
      (err as { error?: { message?: string } }).error?.message || mapErrorMessage(res.status, code);
    throw new ApiError(res.status, code, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type { paths };
