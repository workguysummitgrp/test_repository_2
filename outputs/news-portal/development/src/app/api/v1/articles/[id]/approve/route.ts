import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateCache } from '@/lib/redis';
import { successResponse, notFoundError, errorResponse, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';

interface RouteParams {
  params: { id: string };
}

// POST /api/v1/articles/:id/approve — approve article (reviewer+)
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthRole('reviewer');
    if (isErrorResponse(auth)) return auth;

    const article = await prisma.article.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    if (article.status !== 'in_review') {
      return errorResponse(422, 'UNPROCESSABLE_ENTITY', 'Only articles in review can be approved');
    }

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        reviewerId: auth.id,
        reviewFeedback: null,
      },
    });

    await invalidateCache('articles:*');

    // Create notification for the author
    await prisma.notification.create({
      data: {
        userId: article.authorId,
        type: 'editorial_state',
        title: 'Article Approved',
        body: `Your article "${article.title}" has been approved and published.`,
        link: `/articles/${article.slug}`,
      },
    });

    return successResponse({
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
      publishedAt: updated.publishedAt,
    });
  } catch (error) {
    console.error('[POST /api/v1/articles/:id/approve]', error);
    return internalError();
  }
}
