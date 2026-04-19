"use client";

import { useState, useEffect } from "react";
import { BookingCard } from "@/features/bookings/BookingCard";
import { QRModal } from "@/features/bookings/QRModal";
import { getMyBookings } from "@/features/bookings/api";
import type { Booking, BookingStatus } from "@/features/bookings/api";

type TabKey = "upcoming" | "completed" | "canceled";

const TABS: { key: TabKey; label: string; statuses: BookingStatus[] }[] = [
  { key: "upcoming", label: "예정", statuses: ["CONFIRMED", "REQUESTED", "WAITLISTED", "OFFERED"] },
  { key: "completed", label: "완료", statuses: ["COMPLETED"] },
  { key: "canceled", label: "취소", statuses: ["CANCELED", "REJECTED", "EXPIRED"] },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrBookingId, setQrBookingId] = useState<number | null>(null);

  useEffect(() => {
    const tab = TABS.find((t) => t.key === activeTab)!;
    Promise.allSettled(
      tab.statuses.map((status) => getMyBookings({ bookingStatus: status, limit: 20 }))
    ).then((results) => {
      const all: Booking[] = results
        .filter((r): r is PromiseFulfilledResult<{ items: Booking[] }> => r.status === "fulfilled")
        .flatMap((r) => r.value.items)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(all);
      setLoading(false);
    });
  }, [activeTab]);

  function handleTabChange(key: TabKey) {
    setActiveTab(key);
    setLoading(true);
    setBookings([]);
  }

  return (
    <div>
      <div className="sticky top-[56px] z-30 flex border-b border-border bg-white">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={[
              "flex-1 py-3 text-sm font-semibold transition-colors min-h-[44px]",
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            {activeTab === "upcoming" && "예정된 예약이 없습니다."}
            {activeTab === "completed" && "완료된 예약이 없습니다."}
            {activeTab === "canceled" && "취소된 예약이 없습니다."}
          </div>
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onQR={setQrBookingId}
            />
          ))
        )}
      </div>

      {qrBookingId !== null && (
        <QRModal bookingId={qrBookingId} onClose={() => setQrBookingId(null)} />
      )}
    </div>
  );
}
