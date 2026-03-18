import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { successResponse, validationError, conflictError, internalError } from '@/lib/api-response';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST /api/v1/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { email, password, displayName } = parsed.data;

    // Check existing user - use generic error to prevent enumeration
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Return success-like response to prevent email enumeration (US-007 AC)
      return successResponse({
        message: 'If this email is not already registered, a verification email has been sent.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        status: 'pending_verification',
        role: 'reader',
      },
    });

    // In production: send verification email with token
    // await sendVerificationEmail(email, verificationToken);

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'register',
        entityType: 'user',
        entityId: user.id,
      },
    });

    return successResponse({
      message: 'If this email is not already registered, a verification email has been sent.',
    });
  } catch (error) {
    console.error('[POST /api/v1/auth/register]', error);
    return internalError();
  }
}
