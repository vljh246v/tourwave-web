"use client";

import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  bookingId: number;
  onClose: () => void;
}

export function QRModal({ bookingId, onClose }: QRModalProps) {
  const qrValue = `TOURWAVE:BOOKING:${bookingId}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR 티켓"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white px-6 pb-8 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface hover:bg-border"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="font-display text-xl font-extrabold text-foreground">
          QR 티켓
        </h2>
        <p className="mt-1 text-sm text-muted">예약 #{bookingId}</p>
        <div className="mt-6 flex justify-center">
          <div className="rounded-2xl border-4 border-primary p-4">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          현장에서 운영자에게 이 QR 코드를 보여 주세요.
        </p>
      </div>
    </div>
  );
}
