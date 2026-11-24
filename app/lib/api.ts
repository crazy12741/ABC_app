import { Platform } from 'react-native';
import { authClient } from './auth-client';
import { resolveApiBaseUrl } from './api-base';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (Platform.OS !== 'web') {
    try {
      const cookie = await authClient.getCookie();
      if (cookie) headers.set('Cookie', cookie);
    } catch {
      // The request will still be sent and can return 401.
    }
  }

  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    signal: options.signal,
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export function apiGet<T>(path: string, signal?: AbortSignal) {
  return apiFetch<T>(path, { signal });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: 'POST', body });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: 'PATCH', body });
}

export function apiPut<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, { method: 'PUT', body });
}

export function apiDelete<T>(path: string) {
  return apiFetch<T>(path, { method: 'DELETE' });
}
