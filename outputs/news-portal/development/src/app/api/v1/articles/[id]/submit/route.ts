import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, forbiddenError, errorResponse, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';
import { hasRole } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// POST /api/v1/articles/:id/submit — submit for review
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthRole('editor');
    if (isErrorResponse(auth)) return auth;

    const article = await prisma.article.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    if (article.authorId !== auth.id && !hasRole(auth.role, 'admin')) {
      return forbiddenError('Only the author can submit for review');
    }

    if (article.status !== 'draft') {
      return errorResponse(422, 'UNPROCESSABLE_ENTITY', 'Only draft articles can be submitted for review');
    }

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: { status: 'in_review' },
    });

    return successResponse({
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
    });
  } catch (error) {
    console.error('[POST /api/v1/articles/:id/submit]', error);
    return internalError();
  }
}
