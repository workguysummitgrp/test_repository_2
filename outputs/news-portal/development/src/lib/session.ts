import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from './auth';
import { UserRole } from '@prisma/client';
import { unauthorizedError, forbiddenError } from './api-response';
import { NextResponse } from 'next/server';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getSession();
  if (!user) return unauthorizedError();
  return user;
}

export async function requireAuthRole(role: UserRole): Promise<SessionUser | NextResponse> {
  const user = await getSession();
  if (!user) return unauthorizedError();
  if (!hasRole(user.role, role)) return forbiddenError();
  return user;
}

export function isErrorResponse(result: SessionUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
