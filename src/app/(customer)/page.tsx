"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TourCard } from "@/features/tours/TourCard";
import { TourCardSkeleton } from "@/features/tours/TourCardSkeleton";
import { searchOccurrences } from "@/features/occurrences/api";
import { dateRangeFromNow } from "@/lib/utils/time";
import type { OccurrenceSearchItem } from "@/features/occurrences/api";

interface Section {
  title: string;
  items: OccurrenceSearchItem[];
  loading: boolean;
}

export default function CustomerHomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { title: "지금 예약 가능", items: [], loading: true },
    { title: "인기 액티비티", items: [], loading: true },
    { title: "가성비 액티비티", items: [], loading: true },
  ]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const { dateFrom, dateTo } = dateRangeFromNow(30);
    const base = { dateFrom, dateTo, limit: 10, includeRating: true };

    Promise.allSettled([
      searchOccurrences({ ...base, sort: "START_AT_ASC" }),
      searchOccurrences({ ...base, sort: "RATING_DESC" }),
      searchOccurrences({ ...base, sort: "PRICE_ASC" }),
    ]).then(([upcoming, popular, cheap]) => {
      setSections([
        {
          title: "지금 예약 가능",
          items: upcoming.status === "fulfilled" ? upcoming.value.items : [],
          loading: false,
        },
        {
          title: "인기 액티비티",
          items: popular.status === "fulfilled" ? popular.value.items : [],
          loading: false,
        },
        {
          title: "가성비 액티비티",
          items: cheap.status === "fulfilled" ? cheap.value.items : [],
          loading: false,
        },
      ]);
    });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/explore?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-b from-primary to-primary-dark px-4 pb-6 pt-4">
        <p className="mb-3 font-display text-sm font-semibold tracking-wide text-white/80 uppercase">
          오늘 어떤 액티비티를 찾으세요?
        </p>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="지역·투어명 검색"
            className="w-full rounded-xl bg-white py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      <div className="px-4 py-3">
        <button
          onClick={() => router.push("/explore")}
          className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors min-h-[44px]"
        >
          전체 투어 탐색하기
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="mt-2">
          <div className="flex items-baseline justify-between px-4 pb-2">
            <h2 className="font-display text-lg font-bold text-foreground">
              {section.title}
            </h2>
            <button
              onClick={() => router.push("/explore")}
              className="text-xs text-primary"
            >
              더보기
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {section.loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TourCardSkeleton key={i} className="w-56" />
                ))
              : section.items.length === 0
              ? <p className="text-sm text-muted py-4">항목이 없습니다.</p>
              : section.items.map((item) => (
                  <button
                    key={`${item.occurrence.id}`}
                    onClick={() => router.push(`/tours/${item.tour.id}`)}
                    className="text-left"
                  >
                    <TourCard item={item} className="w-56" />
                  </button>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}
