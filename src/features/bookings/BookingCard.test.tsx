import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingCard } from "./BookingCard";
import type { Booking } from "./api";

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 42,
  organizationId: 1,
  occurrenceId: 10,
  userId: 5,
  partySize: 2,
  status: "CONFIRMED",
  paymentStatus: "AUTHORIZED",
  currency: "KRW",
  amountPaid: null,
  createdAt: "2026-04-20T10:00:00Z",
  ...overrides,
});

describe("BookingCard", () => {
  it("renders booking id", () => {
    render(<BookingCard booking={makeBooking()} onQR={vi.fn()} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("shows green badge for CONFIRMED status", () => {
    render(<BookingCard booking={makeBooking({ status: "CONFIRMED" })} onQR={vi.fn()} />);
    const badge = screen.getByText("확정");
    expect(badge).toHaveClass("bg-green-100");
  });

  it("shows yellow badge for REQUESTED status", () => {
    render(<BookingCard booking={makeBooking({ status: "REQUESTED" })} onQR={vi.fn()} />);
    const badge = screen.getByText("확인 대기");
    expect(badge).toHaveClass("bg-yellow-100");
  });

  it("shows gray badge for CANCELED status", () => {
    render(<BookingCard booking={makeBooking({ status: "CANCELED" })} onQR={vi.fn()} />);
    const badge = screen.getByText("취소");
    expect(badge).toHaveClass("bg-gray-100");
  });

  it("shows QR button for CONFIRMED booking", () => {
    const onQR = vi.fn();
    render(<BookingCard booking={makeBooking({ status: "CONFIRMED" })} onQR={onQR} />);
    const btn = screen.getByRole("button", { name: /QR/i });
    expect(btn).toBeInTheDocument();
  });

  it("calls onQR with booking id when QR button clicked", async () => {
    const onQR = vi.fn();
    render(<BookingCard booking={makeBooking({ status: "CONFIRMED" })} onQR={onQR} />);
    await userEvent.click(screen.getByRole("button", { name: /QR/i }));
    expect(onQR).toHaveBeenCalledWith(42);
  });

  it("does not show QR button for CANCELED booking", () => {
    render(<BookingCard booking={makeBooking({ status: "CANCELED" })} onQR={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /QR/i })).not.toBeInTheDocument();
  });
});
