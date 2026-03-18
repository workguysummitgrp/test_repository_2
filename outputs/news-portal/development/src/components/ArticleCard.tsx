import Image from 'next/image';
import Link from 'next/link';

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: { url: string; altText: string | null } | null;
  author: { id: string; displayName: string; avatarUrl: string | null };
  category: { id: string; name: string; slug: string };
  publishedAt: Date | string | null;
  commentCount: number;
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  featuredImage,
  author,
  category,
  publishedAt,
  commentCount,
}: ArticleCardProps) {
  return (
    <article className="card group overflow-hidden transition-shadow hover:shadow-md">
      {/* Featured Image */}
      {featuredImage && (
        <Link href={`/articles/${slug}`} className="-m-4 mb-0 block overflow-hidden">
          <Image
            src={featuredImage.url}
            alt={featuredImage.altText ?? title}
            width={400}
            height={225}
            className="h-48 w-full object-cover transition-transform group-hover:scale-105"
          />
        </Link>
      )}

      <div className={featuredImage ? 'mt-4' : ''}>
        {/* Category */}
        <Link
          href={`/categories/${category.slug}`}
          className="text-caption font-medium text-primary hover:underline"
        >
          {category.name}
        </Link>

        {/* Title */}
        <h3 className="mt-1 text-h4 leading-snug">
          <Link href={`/articles/${slug}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="mt-2 text-body-sm text-neutral-500 line-clamp-2">{excerpt}</p>
        )}

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between text-caption text-neutral-500">
          <div className="flex items-center gap-2">
            {author.avatarUrl && (
              <Image
                src={author.avatarUrl}
                alt={author.displayName}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span>{author.displayName}</span>
          </div>
          <div className="flex items-center gap-3">
            {publishedAt && (
              <time dateTime={new Date(publishedAt).toISOString()}>
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
            {commentCount > 0 && <span>{commentCount} comments</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
