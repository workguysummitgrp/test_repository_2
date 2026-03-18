import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCommentSchema, commentQuerySchema } from '@/lib/validations';
import { successResponse, validationError, notFoundError, errorResponse, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse, getSession } from '@/lib/session';

// GET /api/v1/comments?articleId=xxx — list comments for article
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = commentQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { articleId, cursor, limit } = parsed.data;

    const article = await prisma.article.findFirst({
      where: { id: articleId, status: 'published', deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        parentId: null, // top-level comments only
        status: { in: ['active', 'flagged'] },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        replies: {
          where: { status: { in: ['active', 'flagged'] } },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return successResponse(
      items.map((c) => ({
        id: c.id,
        body: c.body,
        author: c.author,
        upvotes: c.upvotes,
        downvotes: c.downvotes,
        createdAt: c.createdAt,
        replies: c.replies.map((r) => ({
          id: r.id,
          body: r.body,
          author: r.author,
          upvotes: r.upvotes,
          downvotes: r.downvotes,
          createdAt: r.createdAt,
        })),
      })),
      { limit, nextCursor }
    );
  } catch (error) {
    console.error('[GET /api/v1/comments]', error);
    return internalError();
  }
}

// POST /api/v1/comments — create comment (reader+)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthRole('reader');
    if (isErrorResponse(auth)) return auth;

    const body = await request.json();
    const { articleId } = Object.fromEntries(request.nextUrl.searchParams);

    if (!articleId) {
      return validationError([{ field: 'articleId', message: 'articleId query param is required' }]);
    }

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const article = await prisma.article.findFirst({
      where: { id: articleId, status: 'published', deletedAt: null, commentsEnabled: true },
    });
    if (!article) return errorResponse(422, 'UNPROCESSABLE_ENTITY', 'Article not found or comments are disabled');

    // Validate parent comment if replying
    if (parsed.data.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parsed.data.parentId, articleId },
      });
      if (!parent) return notFoundError('Parent comment');
      if (parent.parentId) return errorResponse(422, 'UNPROCESSABLE_ENTITY', 'Only one level of nesting is allowed');
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        authorId: auth.id,
        body: parsed.data.body,
        parentId: parsed.data.parentId,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    // Notify parent comment author of reply
    if (parsed.data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parsed.data.parentId },
        select: { authorId: true },
      });
      if (parentComment && parentComment.authorId !== auth.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            type: 'comment_reply',
            title: 'New reply to your comment',
            body: parsed.data.body.substring(0, 100),
            link: `/articles/${article.slug}#comment-${comment.id}`,
          },
        });
      }
    }

    return successResponse({
      id: comment.id,
      body: comment.body,
      author: comment.author,
      createdAt: comment.createdAt,
    });
  } catch (error) {
    console.error('[POST /api/v1/comments]', error);
    return internalError();
  }
}
