'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminPage() {
  const { data: analyticsData, isLoading: analyticsLoading } = useSWR('/api/v1/admin/analytics', fetcher);
  const { data: usersData, isLoading: usersLoading } = useSWR('/api/v1/admin/users?pageSize=10', fetcher);

  const analytics = analyticsData?.data;
  const users = usersData?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-h1">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))
        ) : analytics?.overview ? (
          <>
            <StatCard label="Total Articles" value={analytics.overview.totalArticles} />
            <StatCard label="Active Users" value={analytics.overview.totalUsers} />
            <StatCard label="Total Comments" value={analytics.overview.totalComments} />
            <StatCard label="Total Views" value={analytics.overview.totalViews.toLocaleString()} />
          </>
        ) : null}
      </div>

      {/* Top Articles */}
      {analytics?.topArticles && (
        <div className="card">
          <h2 className="text-h3 mb-4">Top Articles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium text-right">Views</th>
                  <th className="pb-2 font-medium text-right">Comments</th>
                  <th className="pb-2 font-medium text-right">Bookmarks</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topArticles.map((article: Record<string, unknown>) => (
                  <tr key={article.id as string} className="border-b border-neutral-100">
                    <td className="py-2.5">{article.title as string}</td>
                    <td className="py-2.5 text-right">{(article.viewCount as number).toLocaleString()}</td>
                    <td className="py-2.5 text-right">{article.commentCount as number}</td>
                    <td className="py-2.5 text-right">{article.bookmarkCount as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div className="card">
        <h2 className="text-h3 mb-4">Recent Users</h2>
        {usersLoading ? (
          <div className="animate-pulse h-32" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: Record<string, unknown>) => (
                  <tr key={user.id as string} className="border-b border-neutral-100">
                    <td className="py-2.5 font-medium">{user.displayName as string}</td>
                    <td className="py-2.5 text-neutral-500">{user.email as string}</td>
                    <td className="py-2.5">
                      <span className="badge bg-primary-light text-primary">{user.role as string}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${(user.status as string) === 'active' ? 'badge-published' : 'badge-draft'}`}>
                        {user.status as string}
                      </span>
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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-body-sm text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
