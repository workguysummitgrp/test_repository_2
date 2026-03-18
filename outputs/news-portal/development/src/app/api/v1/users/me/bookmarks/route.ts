import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookmarkSchema } from '@/lib/validations';
import { successResponse, validationError, notFoundError, conflictError, internalError } from '@/lib/api-response';
import { requireAuth, isErrorResponse } from '@/lib/session';

// GET /api/v1/users/me/bookmarks — list bookmarks
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isErrorResponse(auth)) return auth;

    const cursor = request.nextUrl.searchParams.get('cursor');
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 20), 50);

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: auth.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
            featuredImage: { select: { url: true, altText: true } },
            author: { select: { displayName: true } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    const hasMore = bookmarks.length > limit;
    const items = hasMore ? bookmarks.slice(0, limit) : bookmarks;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : undefined;

    return successResponse(
      items.map((b) => ({
        articleId: b.articleId,
        article: b.article,
        bookmarkedAt: b.createdAt,
      })),
      { limit, nextCursor }
    );
  } catch (error) {
    console.error('[GET /api/v1/users/me/bookmarks]', error);
    return internalError();
  }
}

// POST /api/v1/users/me/bookmarks — add bookmark
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isErrorResponse(auth)) return auth;

    const body = await request.json();
    const parsed = bookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const article = await prisma.article.findFirst({
      where: { id: parsed.data.articleId, status: 'published', deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    const existing = await prisma.bookmark.findUnique({
      where: { userId_articleId: { userId: auth.id, articleId: parsed.data.articleId } },
    });
    if (existing) return conflictError('Article already bookmarked');

    await prisma.bookmark.create({
      data: { userId: auth.id, articleId: parsed.data.articleId },
    });

    return successResponse({ bookmarked: true, articleId: parsed.data.articleId });
  } catch (error) {
    console.error('[POST /api/v1/users/me/bookmarks]', error);
    return internalError();
  }
}

// DELETE /api/v1/users/me/bookmarks — remove bookmark
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isErrorResponse(auth)) return auth;

    const articleId = request.nextUrl.searchParams.get('articleId');
    if (!articleId) {
      return validationError([{ field: 'articleId', message: 'articleId is required' }]);
    }

    const existing = await prisma.bookmark.findUnique({
      where: { userId_articleId: { userId: auth.id, articleId } },
    });
    if (!existing) return notFoundError('Bookmark');

    await prisma.bookmark.delete({
      where: { userId_articleId: { userId: auth.id, articleId } },
    });

    return successResponse({ bookmarked: false, articleId });
  } catch (error) {
    console.error('[DELETE /api/v1/users/me/bookmarks]', error);
    return internalError();
  }
}
