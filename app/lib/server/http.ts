import { z } from 'zod';
import { auth } from '../auth';

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export type SessionUser = typeof auth.$Infer.Session.user;

export async function requireSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new HttpError(401, 'Sign in to continue.');
  }

  return session;
}

export async function requireAdmin(request: Request) {
  const session = await requireSession(request);

  if (session.user.role !== 'admin') {
    throw new HttpError(403, 'Administrator access only.');
  }

  return session;
}

export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new HttpError(400, 'Send a valid JSON body.');
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(422, first?.message ?? 'Check the details and try again.');
  }

  return parsed.data;
}

export function queryValue(request: Request, key: string): string | null {
  return new URL(request.url).searchParams.get(key);
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    if (error.message.includes('duplicate key')) {
      return Response.json(
        { error: 'That record already exists.' },
        { status: 409 },
      );
    }
    console.error('API error:', error.message);
  } else {
    console.error('API error:', error);
  }

  return Response.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 },
  );
}

export function route(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function routeWithParams(
  handler: (
    request: Request,
    params: Record<string, string>,
  ) => Promise<Response>,
) {
  return async (
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> => {
    try {
      return await handler(request, params);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
