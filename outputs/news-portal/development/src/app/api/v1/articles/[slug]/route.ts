import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateCache } from '@/lib/redis';
import { updateArticleSchema } from '@/lib/validations';
import { successResponse, validationError, notFoundError, forbiddenError, internalError } from '@/lib/api-response';
import { getSession, requireAuthRole, isErrorResponse } from '@/lib/session';
import { hasRole } from '@/lib/auth';

interface RouteParams {
  params: { slug: string };
}

// GET /api/v1/articles/:slug — get single article
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const article = await prisma.article.findFirst({
      where: { slug: params.slug, deletedAt: null },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
        category: { select: { id: true, name: true, slug: true } },
        featuredImage: { select: { id: true, url: true, altText: true, width: true, height: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true, bookmarks: true } },
      },
    });

    if (!article) return notFoundError('Article');

    // Non-published articles require auth
    if (article.status !== 'published') {
      const session = await getSession();
      if (!session) return notFoundError('Article');
      const isAuthor = session.id === article.authorId;
      const isPrivileged = hasRole(session.role, 'reviewer');
      if (!isAuthor && !isPrivileged) return notFoundError('Article');
    }

    // Increment view count asynchronously
    if (article.status === 'published') {
      prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    }

    return successResponse({
      id: article.id,
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle,
      body: article.body,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      author: article.author,
      category: article.category,
      tags: article.tags.map((t) => t.tag),
      status: article.status,
      isBreaking: article.isBreaking,
      commentsEnabled: article.commentsEnabled,
      publishedAt: article.publishedAt,
      viewCount: article.viewCount,
      commentCount: article._count.comments,
      bookmarkCount: article._count.bookmarks,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  } catch (error) {
    console.error('[GET /api/v1/articles/:slug]', error);
    return internalError();
  }
}

// PUT /api/v1/articles/:slug — update article (author or admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthRole('editor');
    if (isErrorResponse(auth)) return auth;

    const article = await prisma.article.findFirst({
      where: { slug: params.slug, deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    // Only author or admin can edit
    if (article.authorId !== auth.id && !hasRole(auth.role, 'admin')) {
      return forbiddenError('Only the author or an admin can edit this article');
    }

    const body = await request.json();
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    // Create revision before updating
    const revisionCount = await prisma.articleRevision.count({ where: { articleId: article.id } });
    await prisma.articleRevision.create({
      data: {
        articleId: article.id,
        body: article.body,
        editorId: auth.id,
        revisionNumber: revisionCount + 1,
      },
    });

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: parsed.data,
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    await invalidateCache('articles:*');

    return successResponse({
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('[PUT /api/v1/articles/:slug]', error);
    return internalError();
  }
}

// DELETE /api/v1/articles/:slug — soft-delete article
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthRole('editor');
    if (isErrorResponse(auth)) return auth;

    const article = await prisma.article.findFirst({
      where: { slug: params.slug, deletedAt: null },
    });
    if (!article) return notFoundError('Article');

    if (article.authorId !== auth.id && !hasRole(auth.role, 'admin')) {
      return forbiddenError('Only the author or an admin can delete this article');
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { deletedAt: new Date() },
    });

    await invalidateCache('articles:*');

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/v1/articles/:slug]', error);
    return internalError();
  }
}
