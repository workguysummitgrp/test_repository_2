import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CommentSection } from '@/components/CommentSection';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await prisma.article.findFirst({
    where: { slug: params.slug, status: 'published', deletedAt: null },
  });
  if (!article) return { title: 'Article Not Found' };
  return {
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt ?? undefined,
    openGraph: { title: article.title, description: article.excerpt ?? undefined },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await prisma.article.findFirst({
    where: { slug: params.slug, status: 'published', deletedAt: null },
    include: {
      author: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
      featuredImage: { select: { url: true, altText: true, width: true, height: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  });

  if (!article) notFound();

  // Fire-and-forget view count increment
  prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return (
    <article className="mx-auto max-w-3xl">
      {/* Category & Metadata */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/categories/${article.category.slug}`}
          className="badge bg-primary-light text-primary"
        >
          {article.category.name}
        </Link>
        <span className="text-caption text-neutral-500">
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : ''}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-display mb-2">{article.title}</h1>
      {article.subtitle && (
        <p className="text-h3 font-normal text-neutral-700 mb-6">{article.subtitle}</p>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 mb-8 border-b border-neutral-300 pb-6">
        {article.author.avatarUrl && (
          <Image
            src={article.author.avatarUrl}
            alt={article.author.displayName}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <div>
          <p className="font-medium">{article.author.displayName}</p>
          {article.author.bio && (
            <p className="text-body-sm text-neutral-500">{article.author.bio}</p>
          )}
        </div>
      </div>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText ?? article.title}
            width={article.featuredImage.width ?? 1200}
            height={article.featuredImage.height ?? 630}
            className="w-full object-cover"
            priority
          />
        </div>
      )}

      {/* Article Body */}
      <div
        className="prose prose-lg max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 border-t border-neutral-300 pt-6">
          {article.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full bg-neutral-100 px-3 py-1 text-body-sm text-neutral-700"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Comments */}
      {article.commentsEnabled && (
        <CommentSection articleId={article.id} articleSlug={article.slug} />
      )}
    </article>
  );
}
