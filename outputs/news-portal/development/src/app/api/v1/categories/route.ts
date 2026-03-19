import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validations';
import { successResponse, validationError, notFoundError, conflictError, errorResponse, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';
import { getCached, invalidateCache } from '@/lib/redis';
import slugify from 'slugify';

// GET /api/v1/categories — list all categories (public)
export async function GET() {
  try {
    const categories = await getCached(
      'categories:all',
      () =>
        prisma.category.findMany({
          orderBy: { displayOrder: 'asc' },
          include: {
            children: { orderBy: { displayOrder: 'asc' } },
            _count: { select: { articles: true } },
          },
          where: { parentId: null },
        }),
      300
    );

    return successResponse(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        displayOrder: c.displayOrder,
        articleCount: c._count.articles,
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          description: ch.description,
        })),
      }))
    );
  } catch (error) {
    console.error('[GET /api/v1/categories]', error);
    return internalError();
  }
}

// POST /api/v1/categories — create category (admin)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthRole('admin');
    if (isErrorResponse(auth)) return auth;

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const slug = slugify(parsed.data.name, { lower: true, strict: true });
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return conflictError('A category with this name already exists');

    if (parsed.data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId } });
      if (!parent) return errorResponse(400, 'VALIDATION_ERROR', 'Parent category not found');
      if (parent.parentId) return errorResponse(400, 'VALIDATION_ERROR', 'Only one level of nesting is allowed');
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        parentId: parsed.data.parentId,
        displayOrder: parsed.data.displayOrder ?? 0,
      },
    });

    await invalidateCache('categories:*');

    return successResponse({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: category.displayOrder,
    });
  } catch (error) {
    console.error('[POST /api/v1/categories]', error);
    return internalError();
  }
}
