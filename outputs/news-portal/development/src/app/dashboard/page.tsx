'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: articlesData } = useSWR(
    session ? `/api/v1/articles?author=${(session.user as { id: string }).id}&status=draft&limit=50` : null,
    fetcher
  );

  const articles = articlesData?.data ?? [];

  const statusColors: Record<string, string> = {
    draft: 'badge-draft',
    in_review: 'badge-review',
    published: 'badge-published',
    approved: 'bg-blue-100 text-blue-800',
    archived: 'bg-neutral-100 text-neutral-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h1">Editorial Dashboard</h1>
        <Link href="/dashboard/new" className="btn-primary">
          + New Article
        </Link>
      </div>

      {/* Article List */}
      <div className="card">
        <h2 className="text-h3 mb-4">My Articles</h2>
        {articles.length === 0 ? (
          <p className="text-neutral-500 py-4">No articles yet. Create your first one!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Updated</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article: Record<string, unknown>) => (
                  <tr key={article.id as string} className="border-b border-neutral-100">
                    <td className="py-3 font-medium">{article.title as string}</td>
                    <td className="py-3">
                      <span className={`badge ${statusColors[article.status as string] ?? 'badge-draft'}`}>
                        {(article.status as string).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-500">
                      {(article.category as { name: string })?.name}
                    </td>
                    <td className="py-3 text-neutral-500">
                      {new Date(article.createdAt as string).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-primary hover:underline text-body-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
