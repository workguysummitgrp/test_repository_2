import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const pages = generatePageNumbers(currentPage, totalPages);
  const separator = basePath.includes('?') ? '&' : '?';

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          aria-label="Previous page"
        >
          &laquo; Prev
        </Link>
      ) : (
        <span className="rounded-md px-3 py-2 text-sm text-neutral-300" aria-disabled="true">
          &laquo; Prev
        </span>
      )}

      {/* Page Numbers */}
      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-neutral-500">
            &hellip;
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}${separator}page=${page}`}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          aria-label="Next page"
        >
          Next &raquo;
        </Link>
      ) : (
        <span className="rounded-md px-3 py-2 text-sm text-neutral-300" aria-disabled="true">
          Next &raquo;
        </span>
      )}
    </nav>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
