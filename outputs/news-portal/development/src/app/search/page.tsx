'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArticleCard } from '@/components/ArticleCard';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'relevance';

  const queryString = new URLSearchParams({
    q,
    page: String(page),
    pageSize: '12',
    ...(category ? { category } : {}),
    ...(sort !== 'relevance' ? { sort } : {}),
  }).toString();

  const { data, isLoading } = useSWR(
    q.length >= 2 ? `/api/v1/search?${queryString}` : null,
    fetcher
  );

  const articles = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, pageSize: 12 };
  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-h1">Search</h1>
      <SearchBar defaultValue={q} />

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={sort}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', e.target.value);
            params.set('page', '1');
            router.push(`/search?${params.toString()}`);
          }}
          className="input-field w-auto"
          aria-label="Sort results"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="views">Most viewed</option>
        </select>
        {meta.total > 0 && (
          <span className="text-body-sm text-neutral-500">
            {meta.total} result{meta.total !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-64" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article: Record<string, unknown>) => (
            <ArticleCard
              key={article.id as string}
              title={article.title as string}
              slug={article.slug as string}
              excerpt={article.excerpt as string}
              featuredImage={article.thumbnailUrl ? { url: article.thumbnailUrl as string, altText: '' } : null}
              author={article.author as { id: string; displayName: string; avatarUrl: string | null }}
              category={article.category as { id: string; name: string; slug: string }}
              publishedAt={article.publishedAt as string}
              commentCount={0}
            />
          ))}
        </div>
      ) : q.length >= 2 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 text-lg">No results found for "{q}"</p>
          <p className="text-neutral-500 text-body-sm mt-2">Try different keywords or broaden your search.</p>
        </div>
      ) : null}

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} basePath={`/search?q=${q}`} />}
    </div>
  );
}
