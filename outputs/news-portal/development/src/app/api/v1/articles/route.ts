import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateCache, getCached } from '@/lib/redis';
import { createArticleSchema, articleQuerySchema } from '@/lib/validations';
import { successResponse, errorResponse, validationError, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse, getSession } from '@/lib/session';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';

// GET /api/v1/articles — list published articles (public)
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = articleQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { category, tag, author, status, cursor, limit, sort, order } = parsed.data;
    const session = await getSession();

    // Non-published statuses require editor+ role
    const effectiveStatus = status && session?.role && ['editor', 'reviewer', 'admin'].includes(session.role)
      ? status
      : 'published';

    const where: Prisma.ArticleWhereInput = {
      status: effectiveStatus as Prisma.EnumArticleStatusFilter['equals'],
      deletedAt: null,
      ...(category ? { category: { slug: category } } : {}),
      ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
      ...(author ? { authorId: author } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    };

    const cacheKey = `articles:${JSON.stringify({ ...parsed.data, effectiveStatus })}`;
    const articles = await getCached(
      cacheKey,
      () =>
        prisma.article.findMany({
          where,
          orderBy: { [sort === 'view_count' ? 'viewCount' : sort === 'created_at' ? 'createdAt' : 'publishedAt']: order },
          take: limit + 1,
          include: {
            author: { select: { id: true, displayName: true, avatarUrl: true } },
            category: { select: { id: true, name: true, slug: true } },
            featuredImage: { select: { id: true, url: true, altText: true } },
            tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
            _count: { select: { comments: true } },
          },
        }),
      60
    );

    const hasMore = articles.length > limit;
    const items = hasMore ? articles.slice(0, limit) : articles;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return successResponse(
      items.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        subtitle: a.subtitle,
        excerpt: a.excerpt,
        featuredImage: a.featuredImage,
        author: a.author,
        category: a.category,
        tags: a.tags.map((t) => t.tag),
        status: a.status,
        publishedAt: a.publishedAt,
        viewCount: a.viewCount,
        commentCount: a._count.comments,
        createdAt: a.createdAt,
      })),
      { limit, nextCursor }
    );
  } catch (error) {
    console.error('[GET /api/v1/articles]', error);
    return internalError();
  }
}

// POST /api/v1/articles — create article (editor+)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthRole('editor');
    if (isErrorResponse(auth)) return auth;

    const body = await request.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { title, subtitle, body: articleBody, categoryId, tags, featuredImageId, excerpt, metaTitle, metaDescription, commentsEnabled } = parsed.data;

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return errorResponse(400, 'VALIDATION_ERROR', 'Category not found');

    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true });
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        subtitle,
        body: articleBody,
        excerpt,
        categoryId,
        authorId: auth.id,
        featuredImageId,
        metaTitle,
        metaDescription,
        commentsEnabled: commentsEnabled ?? true,
        ...(tags && tags.length > 0
          ? {
              tags: {
                create: await Promise.all(
                  tags.map(async (tagSlug) => {
                    const tag = await prisma.tag.upsert({
                      where: { slug: tagSlug },
                      create: { name: tagSlug, slug: tagSlug },
                      update: {},
                    });
                    return { tagId: tag.id };
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        featuredImage: { select: { id: true, url: true, altText: true } },
      },
    });

    await invalidateCache('articles:*');

    return successResponse({
      id: article.id,
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      author: article.author,
      category: article.category,
      tags: article.tags.map((t) => t.tag),
      status: article.status,
      publishedAt: article.publishedAt,
      viewCount: article.viewCount,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  } catch (error) {
    console.error('[POST /api/v1/articles]', error);
    return internalError();
  }
}
