import { QrCode } from "lucide-react";
import type { Booking, BookingStatus } from "./api";

interface BookingCardProps {
  booking: Booking;
  onQR: (bookingId: number) => void;
}

type BadgeConfig = {
  label: string;
  className: string;
};

const STATUS_BADGE: Record<BookingStatus, BadgeConfig> = {
  CONFIRMED:  { label: "확정",       className: "bg-green-100 text-green-800" },
  REQUESTED:  { label: "확인 대기",  className: "bg-yellow-100 text-yellow-800" },
  WAITLISTED: { label: "대기 중",    className: "bg-yellow-100 text-yellow-800" },
  OFFERED:    { label: "수락 대기",  className: "bg-blue-100 text-blue-800" },
  REJECTED:   { label: "거절됨",     className: "bg-gray-100 text-gray-600" },
  CANCELED:   { label: "취소",       className: "bg-gray-100 text-gray-600" },
  EXPIRED:    { label: "만료됨",     className: "bg-gray-100 text-gray-600" },
  COMPLETED:  { label: "완료",       className: "bg-gray-100 text-gray-600" },
};

const QR_ELIGIBLE: BookingStatus[] = ["CONFIRMED", "OFFERED"];

export function BookingCard({ booking, onQR }: BookingCardProps) {
  const badge = STATUS_BADGE[booking.status];
  const showQR = QR_ELIGIBLE.includes(booking.status);
  const createdDate = new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(booking.createdAt));

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              badge.className,
            ].join(" ")}
          >
            {badge.label}
          </span>
          <span className="text-xs text-muted">예약 #{booking.id}</span>
        </div>
        <p className="mt-1 text-sm text-muted">인원 {booking.partySize}명</p>
        <p className="text-xs text-muted">{createdDate} 예약</p>
      </div>
      {showQR && (
        <button
          onClick={() => onQR(booking.id)}
          aria-label="QR 티켓 보기"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface hover:bg-border transition-colors"
        >
          <QrCode className="h-5 w-5 text-foreground" />
        </button>
      )}
    </div>
  );
}
