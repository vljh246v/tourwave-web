"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, MapPin, Star, ChevronRight } from "lucide-react";
import { getTour, getTourOccurrences } from "@/features/tours/api";
import { formatInTimezone, dateRangeFromNow } from "@/lib/utils/time";
import { formatMoney } from "@/lib/utils/money";
import type { TourDetail, TourOccurrence } from "@/features/tours/api";

export default function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedOccurrenceId = searchParams.get("occurrenceId");

  const [tour, setTour] = useState<TourDetail | null>(null);
  const [occurrences, setOccurrences] = useState<TourOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<number | null>(
    preSelectedOccurrenceId ? Number(preSelectedOccurrenceId) : null
  );

  useEffect(() => {
    const tourId = Number(id);
    const { dateFrom, dateTo } = dateRangeFromNow(60);

    Promise.all([
      getTour(tourId),
      getTourOccurrences(tourId, { dateFrom, dateTo }),
    ])
      .then(([tourData, occData]) => {
        setTour(tourData);
        const scheduled = occData.items.filter((o) => o.status === "SCHEDULED");
        setOccurrences(scheduled);
        if (!selectedOccurrenceId && scheduled.length > 0) {
          setSelectedOccurrenceId(scheduled[0].id);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedOccurrence = occurrences.find((o) => o.id === selectedOccurrenceId);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="p-8 text-center text-sm text-muted">투어를 찾을 수 없습니다.</div>
    );
  }

  function handleBook() {
    if (!selectedOccurrenceId) return;
    router.push(`/tours/${id}/book?occurrenceId=${selectedOccurrenceId}`);
  }

  return (
    <div className="pb-28">
      <div className="relative h-64 w-full bg-primary">
        {tour.coverImageUrl ? (
          <Image
            src={tour.coverImageUrl}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary to-primary-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white"
          aria-label="뒤로"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-extrabold leading-tight text-foreground">
          {tour.title}
        </h1>
        {tour.subtitle && (
          <p className="mt-1 text-sm text-muted">{tour.subtitle}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{tour.locationText}</span>
          </div>
          {tour.ratingSummary && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>
                {tour.ratingSummary.avgRating.toFixed(1)} ({tour.ratingSummary.reviewCount}개 리뷰)
              </span>
            </div>
          )}
        </div>

        {tour.instructors && tour.instructors.length > 0 && (
          <div className="mt-4">
            <h2 className="font-display text-base font-bold text-foreground">강사</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {tour.instructors.map((inst, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-surface px-3 py-1 text-xs text-foreground"
                >
                  {inst.displayName ?? String(inst.id ?? idx)}
                </span>
              ))}
            </div>
          </div>
        )}

        {occurrences.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-base font-bold text-foreground">
              예약 가능한 일정
            </h2>
            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {occurrences.map((occ) => {
                const isSelected = occ.id === selectedOccurrenceId;
                return (
                  <button
                    key={occ.id}
                    onClick={() => setSelectedOccurrenceId(occ.id)}
                    className={[
                      "flex-shrink-0 rounded-xl border px-4 py-3 text-left transition-colors min-h-[44px]",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-white text-foreground",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold">
                      {formatInTimezone(occ.startAtUtc, occ.timezone, {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatInTimezone(occ.startAtUtc, occ.timezone, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      {formatMoney(occ.price.amount, occ.price.currency)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {occurrences.length === 0 && (
          <p className="mt-6 text-sm text-muted">현재 예약 가능한 일정이 없습니다.</p>
        )}
      </div>

      <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 right-0 border-t border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div>
            {selectedOccurrence ? (
              <>
                <p className="text-xs text-muted">선택된 일정</p>
                <p className="text-base font-bold text-foreground">
                  {formatMoney(
                    selectedOccurrence.price.amount,
                    selectedOccurrence.price.currency
                  )}
                  <span className="text-xs font-normal text-muted"> / 인</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">일정을 선택해 주세요</p>
            )}
          </div>
          <button
            onClick={handleBook}
            disabled={!selectedOccurrenceId}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white disabled:opacity-40 transition-opacity"
          >
            예약하기
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
