import { apiClient } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Booking = components["schemas"]["Booking"];
export type BookingDetail = components["schemas"]["BookingDetail"];
export type BookingStatus = components["schemas"]["BookingStatus"];

export async function createBooking(
  occurrenceId: number,
  partySize: number,
  noteToOperator?: string
): Promise<Booking> {
  return apiClient.post(`/occurrences/${occurrenceId}/bookings`, {
    partySize,
    noteToOperator: noteToOperator ?? null,
  });
}

export async function getMyBookings(params?: {
  bookingStatus?: BookingStatus;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Booking[]; nextCursor?: string | null }> {
  const q = new URLSearchParams();
  if (params?.bookingStatus) q.set("bookingStatus", params.bookingStatus);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const qs = q.toString();
  return apiClient.get<{ items: Booking[]; nextCursor?: string | null }>(
    `/me/bookings${qs ? `?${qs}` : ""}`
  );
}

export async function getBooking(bookingId: number): Promise<BookingDetail> {
  return apiClient.get<BookingDetail>(`/bookings/${bookingId}`);
}

export async function cancelBooking(bookingId: number): Promise<void> {
  return apiClient.post(`/bookings/${bookingId}/cancel`, {});
}
