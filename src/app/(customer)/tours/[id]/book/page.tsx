"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Minus, Plus, CheckCircle2 } from "lucide-react";
import { getTour, getTourOccurrences } from "@/features/tours/api";
import { getQuote } from "@/features/occurrences/api";
import { createBooking } from "@/features/bookings/api";
import { formatInTimezone, dateRangeFromNow } from "@/lib/utils/time";
import { formatMoney } from "@/lib/utils/money";
import type { TourDetail, TourOccurrence } from "@/features/tours/api";
import type { QuoteResponse } from "@/features/occurrences/api";
import type { Booking } from "@/features/bookings/api";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "일정 확인",
  2: "인원 선택",
  3: "예약 확인",
};

export default function BookingFlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preOccurrenceId = searchParams.get("occurrenceId");

  const [step, setStep] = useState<Step>(1);
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [occurrences, setOccurrences] = useState<TourOccurrence[]>([]);
  const [selectedOcc, setSelectedOcc] = useState<TourOccurrence | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tourId = Number(id);
    const { dateFrom, dateTo } = dateRangeFromNow(60);
    Promise.all([
      getTour(tourId),
      getTourOccurrences(tourId, { dateFrom, dateTo }),
    ]).then(([tourData, occData]) => {
      setTour(tourData);
      const scheduled = occData.items.filter((o) => o.status === "SCHEDULED");
      setOccurrences(scheduled);
      const preSelected = preOccurrenceId
        ? scheduled.find((o) => o.id === Number(preOccurrenceId))
        : null;
      setSelectedOcc(preSelected ?? scheduled[0] ?? null);
    });
  }, [id, preOccurrenceId]);

  useEffect(() => {
    if (!selectedOcc || step < 2) return;
    setQuoteLoading(true);
    getQuote(selectedOcc.id, partySize)
      .then(setQuote)
      .catch(() => setQuote(null))
      .finally(() => setQuoteLoading(false));
  }, [selectedOcc, partySize, step]);

  async function handleSubmit() {
    if (!selectedOcc) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking(selectedOcc.id, partySize);
      setBookingResult(booking);
    } catch (e) {
      setError(e instanceof Error ? e.message : "예약 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (bookingResult) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">
          예약 신청 완료!
        </h2>
        <p className="mt-2 text-sm text-muted">
          예약 #{bookingResult.id} — 운영자 확인 후 최종 확정됩니다.
        </p>
        <p className="mt-1 text-xs text-muted">
          상태: {bookingResult.status === "REQUESTED" ? "확인 대기" : "대기자 명단"}
        </p>
        <button
          onClick={() => router.replace("/bookings")}
          className="mt-8 w-full max-w-xs rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white min-h-[44px]"
        >
          예약 내역 보기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="sticky top-[56px] z-30 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as Step))}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex gap-1">
              {([1, 2, 3] as Step[]).map((s) => (
                <div
                  key={s}
                  className={[
                    "h-1 flex-1 rounded-full transition-colors",
                    s <= step ? "bg-primary" : "bg-border",
                  ].join(" ")}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">{STEP_LABELS[step]}</p>
          </div>
        </div>
      </div>

      {tour && (
        <div className="px-4 py-2 border-b border-border">
          <p className="font-display text-base font-bold text-foreground truncate">
            {tour.title}
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="px-4 py-4">
          <h2 className="font-display text-lg font-bold text-foreground">일정 선택</h2>
          <div className="mt-3 space-y-2">
            {occurrences.length === 0 ? (
              <p className="text-sm text-muted">예약 가능한 일정이 없습니다.</p>
            ) : (
              occurrences.map((occ) => {
                const isSelected = occ.id === selectedOcc?.id;
                return (
                  <button
                    key={occ.id}
                    onClick={() => setSelectedOcc(occ)}
                    className={[
                      "w-full rounded-xl border p-4 text-left transition-colors min-h-[44px]",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatInTimezone(occ.startAtUtc, occ.timezone, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatInTimezone(occ.startAtUtc, occ.timezone, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" ~ "}
                          {formatInTimezone(occ.endAtUtc, occ.timezone, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-primary-dark">
                        {formatMoney(occ.price.amount, occ.price.currency)}
                        <span className="text-xs font-normal text-muted"> /인</span>
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {step === 2 && selectedOcc && (
        <div className="px-4 py-4">
          <h2 className="font-display text-lg font-bold text-foreground">인원 선택</h2>
          <p className="mt-1 text-sm text-muted">최대 {selectedOcc.capacity}명</p>
          <div className="mt-6 flex items-center justify-center gap-8">
            <button
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              disabled={partySize <= 1}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-30 hover:bg-surface transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="font-display text-4xl font-extrabold text-foreground w-12 text-center">
              {partySize}
            </span>
            <button
              onClick={() => setPartySize((n) => Math.min(selectedOcc.capacity, n + 1))}
              disabled={partySize >= selectedOcc.capacity}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-30 hover:bg-surface transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          {quoteLoading ? (
            <p className="mt-4 text-center text-sm text-muted">가격 계산 중...</p>
          ) : quote ? (
            <div className="mt-6 rounded-xl bg-surface p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">단가</span>
                <span>{formatMoney(quote.unitPrice, quote.currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm font-bold">
                <span className="text-foreground">합계</span>
                <span className="text-primary-dark">
                  {formatMoney(quote.totalPrice, quote.currency)}
                </span>
              </div>
              {quote.willWaitlist && (
                <p className="mt-2 text-xs text-yellow-600">
                  * 현재 자리가 없어 대기자 명단에 등록됩니다.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {step === 3 && selectedOcc && (
        <div className="px-4 py-4">
          <h2 className="font-display text-lg font-bold text-foreground">예약 확인</h2>
          <div className="mt-4 rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">투어</span>
              <span className="font-semibold text-foreground text-right max-w-[60%]">
                {tour?.title}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">일정</span>
              <span className="text-foreground">
                {formatInTimezone(selectedOcc.startAtUtc, selectedOcc.timezone, {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">인원</span>
              <span className="text-foreground">{partySize}명</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-foreground">총 금액</span>
              <span className="text-primary-dark">
                {quote
                  ? formatMoney(quote.totalPrice, quote.currency)
                  : formatMoney(
                      selectedOcc.price.amount * partySize,
                      selectedOcc.price.currency
                    )}
              </span>
            </div>
            {quote?.willWaitlist && (
              <p className="text-xs text-yellow-600">
                * 자리가 없어 대기자 명단에 등록됩니다.
              </p>
            )}
          </div>
          {error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom))] left-0 right-0 border-t border-border bg-white px-4 py-3">
        <div className="mx-auto max-w-md">
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 && !selectedOcc}
              className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-40 min-h-[44px] transition-opacity"
            >
              {step === 1 ? "인원 선택" : "예약 확인"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2 transition-opacity"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  처리 중...
                </>
              ) : (
                "예약 신청"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
