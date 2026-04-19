"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, MapPin, Star, X } from "lucide-react";
import Image from "next/image";
import { searchOccurrences } from "@/features/occurrences/api";
import { dateRangeFromNow, formatInTimezone } from "@/lib/utils/time";
import { formatMoney } from "@/lib/utils/money";
import { TourCardSkeleton } from "@/features/tours/TourCardSkeleton";
import type { OccurrenceSearchItem, SortOption } from "@/features/occurrences/api";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "일정 빠른 순", value: "START_AT_ASC" },
  { label: "평점 높은 순", value: "RATING_DESC" },
  { label: "가격 낮은 순", value: "PRICE_ASC" },
  { label: "가격 높은 순", value: "PRICE_DESC" },
];

export function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortOption>("START_AT_ASC");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [items, setItems] = useState<OccurrenceSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchResults = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      setLoading(true);
      setError(null);
      const { dateFrom, dateTo } = dateRangeFromNow(30);
      try {
        const res = await searchOccurrences({
          dateFrom,
          dateTo,
          location: query || undefined,
          sort,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          includeRating: true,
          limit: 20,
          onlyAvailable: true,
          cursor: opts.reset ? undefined : (nextCursor ?? undefined),
        });
        if (opts.reset) {
          setItems(res.items);
        } else {
          setItems((prev) => [...prev, ...res.items]);
        }
        setNextCursor(res.nextCursor ?? null);
      } catch {
        setError("검색 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [query, sort, priceMin, priceMax, nextCursor]
  );

  useEffect(() => {
    fetchResults({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, priceMin, priceMax]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchResults({ reset: true });
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-[56px] z-30 border-b border-border bg-white px-4 py-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="지역·투어명 검색"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="최소 금액"
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
              <span className="text-muted">~</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="최대 금액"
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-border">
        {loading && items.length === 0 ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <TourCardSkeleton key={i} className="w-full h-28" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            {items.map((item) => (
              <button
                key={item.occurrence.id}
                onClick={() =>
                  router.push(
                    `/tours/${item.tour.id}?occurrenceId=${item.occurrence.id}`
                  )
                }
                className="flex w-full gap-3 p-4 text-left hover:bg-surface active:bg-surface transition-colors"
              >
                <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-primary">
                  {item.tour.coverImageUrl ? (
                    <Image
                      src={item.tour.coverImageUrl}
                      alt={item.tour.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-primary-dark" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-bold text-foreground truncate">
                    {item.tour.title}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1 text-muted">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs truncate">{item.tour.locationText}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatInTimezone(item.occurrence.startAtUtc, item.occurrence.timezone)}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-dark">
                      {formatMoney(
                        item.occurrence.price.amount,
                        item.occurrence.price.currency
                      )}
                    </span>
                    {item.ratingSummary && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted">
                          {item.ratingSummary.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {nextCursor && (
              <div className="p-4">
                <button
                  onClick={() => fetchResults()}
                  disabled={loading}
                  className="w-full rounded-xl border border-border py-3 text-sm text-foreground hover:bg-surface disabled:opacity-50"
                >
                  {loading ? "불러오는 중..." : "더보기"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
