import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { Pagination } from '@/components/Pagination';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) return { title: 'Category Not Found' };
  return { title: `${category.name} - News Portal`, description: category.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 12;
  const skip = (page - 1) * pageSize;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { categoryId: category.id, status: 'published', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        featuredImage: { select: { url: true, altText: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.article.count({
      where: { categoryId: category.id, status: 'published', deletedAt: null },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h1 className="text-h1 mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-neutral-500 mb-6">{category.description}</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            title={article.title}
            slug={article.slug}
            excerpt={article.excerpt}
            featuredImage={article.featuredImage}
            author={article.author}
            category={article.category}
            publishedAt={article.publishedAt}
            commentCount={article._count.comments}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-center text-neutral-500 py-12">No articles in this category yet.</p>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} basePath={`/categories/${params.slug}`} />
      )}
    </div>
  );
}
