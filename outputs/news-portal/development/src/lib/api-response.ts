import { NextResponse } from 'next/server';

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}

export function errorResponse(status: number, code: string, message: string, details?: ApiError['details']) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function validationError(details: ApiError['details']) {
  return errorResponse(400, 'VALIDATION_ERROR', 'Validation failed', details);
}

export function unauthorizedError(message = 'Authentication required') {
  return errorResponse(401, 'UNAUTHORIZED', message);
}

export function forbiddenError(message = 'Insufficient permissions') {
  return errorResponse(403, 'FORBIDDEN', message);
}

export function notFoundError(resource = 'Resource') {
  return errorResponse(404, 'NOT_FOUND', `${resource} not found`);
}

export function conflictError(message: string) {
  return errorResponse(409, 'CONFLICT', message);
}

export function internalError(message = 'An unexpected error occurred') {
  console.error('[InternalError]', message);
  return errorResponse(500, 'INTERNAL_ERROR', message);
}
