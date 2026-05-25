/** Shared fetch helpers for scan sub-checks. */

export const DEFAULT_TIMEOUT_MS = 8000;

export async function safeFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number; userAgent?: string },
): Promise<Response | null> {
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers ?? {});
    if (init.userAgent && !headers.has("user-agent")) {
      headers.set("user-agent", init.userAgent);
    }
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchText(url: string, userAgent: string): Promise<string | null> {
  const res = await safeFetch(url, { method: "GET", userAgent });
  if (!res || !res.ok) return null;
  try {
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchJson<T>(url: string, userAgent: string): Promise<T | null> {
  const res = await safeFetch(url, {
    method: "GET",
    userAgent,
    headers: { accept: "application/json" },
  });
  if (!res || !res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
