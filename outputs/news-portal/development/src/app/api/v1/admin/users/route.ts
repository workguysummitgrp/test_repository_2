import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminUserQuerySchema, updateUserRoleSchema } from '@/lib/validations';
import { successResponse, validationError, notFoundError, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';
import { Prisma } from '@prisma/client';

// GET /api/v1/admin/users — list all users (admin)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthRole('admin');
    if (isErrorResponse(auth)) return auth;

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = adminUserQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { page, pageSize, role, status, search } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role: role as Prisma.EnumUserRoleFilter['equals'] } : {}),
      ...(status ? { status: status as Prisma.EnumUserStatusFilter['equals'] } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { displayName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { articles: true, comments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        articleCount: u._count.articles,
        commentCount: u._count.comments,
      })),
      { total, page, pageSize }
    );
  } catch (error) {
    console.error('[GET /api/v1/admin/users]', error);
    return internalError();
  }
}

// PUT /api/v1/admin/users — update user role (admin)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuthRole('admin');
    if (isErrorResponse(auth)) return auth;

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) return validationError([{ field: 'userId', message: 'userId is required' }]);

    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notFoundError('User');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: parsed.data.role as Prisma.EnumUserRoleFieldUpdateOperationsInput['set'] },
      select: { id: true, email: true, displayName: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.id,
        action: 'role_change',
        entityType: 'user',
        entityId: userId,
        changes: { from: user.role, to: parsed.data.role },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('[PUT /api/v1/admin/users]', error);
    return internalError();
  }
}
