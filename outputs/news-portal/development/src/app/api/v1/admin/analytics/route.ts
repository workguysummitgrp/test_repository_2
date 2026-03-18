import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyticsQuerySchema } from '@/lib/validations';
import { successResponse, validationError, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';
import { getCached } from '@/lib/redis';

// GET /api/v1/admin/analytics — analytics dashboard (admin)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthRole('admin');
    if (isErrorResponse(auth)) return auth;

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = analyticsQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const cacheKey = `admin:analytics:${JSON.stringify(parsed.data)}`;
    const analytics = await getCached(
      cacheKey,
      async () => {
        const [totalArticles, totalUsers, totalComments, totalViews, recentArticles] =
          await Promise.all([
            prisma.article.count({ where: { deletedAt: null } }),
            prisma.user.count({ where: { status: 'active' } }),
            prisma.comment.count({ where: { status: 'active' } }),
            prisma.article.aggregate({ _sum: { viewCount: true } }),
            prisma.article.findMany({
              where: { status: 'published', deletedAt: null },
              orderBy: { viewCount: 'desc' },
              take: 10,
              select: {
                id: true,
                title: true,
                slug: true,
                viewCount: true,
                publishedAt: true,
                _count: { select: { comments: true, bookmarks: true } },
              },
            }),
          ]);

        return {
          overview: {
            totalArticles,
            totalUsers,
            totalComments,
            totalViews: totalViews._sum.viewCount ?? 0,
          },
          topArticles: recentArticles.map((a) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            viewCount: a.viewCount,
            commentCount: a._count.comments,
            bookmarkCount: a._count.bookmarks,
            publishedAt: a.publishedAt,
          })),
        };
      },
      300
    );

    return successResponse(analytics);
  } catch (error) {
    console.error('[GET /api/v1/admin/analytics]', error);
    return internalError();
  }
}
