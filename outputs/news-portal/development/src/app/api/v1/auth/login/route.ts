import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { successResponse, validationError, errorResponse, internalError } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

// POST /api/v1/auth/login — credentials login (API alternative to NextAuth signIn)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Generic error to prevent user enumeration
    const genericError = () => errorResponse(401, 'UNAUTHORIZED', 'Invalid email or password');

    if (!user || !user.passwordHash) return genericError();

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return errorResponse(429, 'RATE_LIMITED', 'Account is locked. Please try again later.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.loginAttempts + 1;
      const updateData: Record<string, unknown> = { loginAttempts: attempts };
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return genericError();
    }

    if (user.status === 'suspended' || user.status === 'deleted') {
      return errorResponse(403, 'FORBIDDEN', 'Account is not active');
    }

    // Reset attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'login',
        entityType: 'user',
        entityId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
      },
    });

    // In practice, NextAuth handles JWT/session creation via /api/auth/[...nextauth]
    // This endpoint is for API-only clients
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('[POST /api/v1/auth/login]', error);
    return internalError();
  }
}
