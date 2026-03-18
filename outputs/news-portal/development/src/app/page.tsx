import { prisma } from '@/lib/prisma';
import { ArticleCard } from '@/components/ArticleCard';
import { SearchBar } from '@/components/SearchBar';
import Link from 'next/link';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const [articles, categories, breakingNews] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        featuredImage: { select: { url: true, altText: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { displayOrder: 'asc' },
      take: 8,
    }),
    prisma.article.findMany({
      where: { status: 'published', isBreaking: true, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: {
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Breaking News Banner */}
      {breakingNews.length > 0 && (
        <div className="rounded-lg bg-accent-light border border-accent/20 p-4">
          <span className="badge-breaking mr-2">BREAKING</span>
          {breakingNews.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="text-sm font-medium text-accent hover:underline mr-4"
            >
              {article.title}
            </Link>
          ))}
        </div>
      )}

      {/* Search */}
      <SearchBar />

      {/* Category Nav */}
      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Categories">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="whitespace-nowrap rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-primary-light hover:border-primary hover:text-primary transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* Article Grid */}
      <section>
        <h2 className="text-h2 mb-4">Latest News</h2>
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
      </section>

      {articles.length === 0 && (
        <p className="text-center text-neutral-500 py-12">
          No articles published yet. Check back soon!
        </p>
      )}
    </div>
  );
}
