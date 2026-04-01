import Link from "next/link";

import { Button } from "@/components/ui/button";

function buildHref(basePath: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function AdminPagination({
  basePath,
  page,
  hasNext,
  query,
  label = "Page",
}: {
  basePath: string;
  page: number;
  hasNext: boolean;
  query?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-sm text-text-secondary">
        {label} {page}
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="secondary" size="sm" disabled className="justify-start">
            Previous
          </Button>
        ) : (
          <Button asChild variant="secondary" size="sm" className="justify-start">
            <Link href={buildHref(basePath, { q: query, page: page - 1 })}>Previous</Link>
          </Button>
        )}
        {hasNext ? (
          <Button asChild variant="secondary" size="sm" className="justify-start">
            <Link href={buildHref(basePath, { q: query, page: page + 1 })}>Next</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled className="justify-start">
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
