import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchSchema } from '@/lib/validations';
import { successResponse, validationError, internalError } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

// GET /api/v1/search — full-text article search
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = searchSchema.safeParse(params);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { q, category, author, from, to, sort, page, pageSize } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ArticleWhereInput = {
      status: 'published',
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
      ],
      ...(category ? { category: { slug: category } } : {}),
      ...(author ? { authorId: author } : {}),
      ...(from || to
        ? {
            publishedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ArticleOrderByWithRelationInput =
      sort === 'newest'
        ? { publishedAt: 'desc' }
        : sort === 'oldest'
          ? { publishedAt: 'asc' }
          : sort === 'views'
            ? { viewCount: 'desc' }
            : { publishedAt: 'desc' }; // relevance fallback

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          author: { select: { id: true, displayName: true } },
          category: { select: { name: true, slug: true } },
          featuredImage: { select: { url: true, altText: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return successResponse(
      articles.map((a) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt,
        slug: a.slug,
        category: a.category,
        author: a.author,
        publishedAt: a.publishedAt,
        thumbnailUrl: a.featuredImage?.url,
      })),
      { total, page, pageSize }
    );
  } catch (error) {
    console.error('[GET /api/v1/search]', error);
    return internalError();
  }
}
