import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundError, errorResponse, validationError, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

const rejectSchema = z.object({
  feedback: z.string().min(1).max(2000),
});

interface RouteParams {
  params: { id: string };
}

// POST /api/v1/articles/:id/reject — reject article (reviewer+)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthRole('reviewer');
    if (isErrorResponse(auth)) return auth;

    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const article = await prisma.article.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    if (article.status !== 'in_review') {
      return errorResponse(422, 'UNPROCESSABLE_ENTITY', 'Only articles in review can be rejected');
    }

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        status: 'draft',
        reviewerId: auth.id,
        reviewFeedback: parsed.data.feedback,
      },
    });

    await prisma.notification.create({
      data: {
        userId: article.authorId,
        type: 'editorial_state',
        title: 'Article Returned for Revision',
        body: `Your article "${article.title}" needs revisions: ${parsed.data.feedback}`,
        link: `/dashboard`,
      },
    });

    return successResponse({
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
      reviewFeedback: updated.reviewFeedback,
    });
  } catch (error) {
    console.error('[POST /api/v1/articles/:id/reject]', error);
    return internalError();
  }
}
