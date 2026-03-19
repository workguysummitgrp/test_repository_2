import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations';
import { successResponse, validationError, internalError } from '@/lib/api-response';
import { requireAuth, isErrorResponse } from '@/lib/session';

// GET /api/v1/users/me — get current user profile
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isErrorResponse(auth)) return auth;

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        emailVerified: true,
        preferences: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    return successResponse({
      ...user,
      articleCount: user?._count.articles,
      commentCount: user?._count.comments,
      bookmarkCount: user?._count.bookmarks,
    });
  } catch (error) {
    console.error('[GET /api/v1/users/me]', error);
    return internalError();
  }
}

// PUT /api/v1/users/me — update profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isErrorResponse(auth)) return auth;

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const updated = await prisma.user.update({
      where: { id: auth.id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        updatedAt: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('[PUT /api/v1/users/me]', error);
    return internalError();
  }
}
