import { apiClient } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Tour = components["schemas"]["Tour"];
export type TourDetail = components["schemas"]["TourDetail"];
export type TourOccurrence = components["schemas"]["TourOccurrence"];

export async function getTours(params?: {
  categoryId?: number;
  location?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: Tour[]; nextCursor?: string | null }> {
  const q = new URLSearchParams();
  if (params?.categoryId != null) q.set("categoryId", String(params.categoryId));
  if (params?.location) q.set("location", params.location);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const qs = q.toString();
  return apiClient.get<{ items: Tour[]; nextCursor?: string | null }>(`/tours${qs ? `?${qs}` : ""}`);
}

export async function getTour(tourId: number): Promise<TourDetail> {
  return apiClient.get<TourDetail>(`/tours/${tourId}`);
}

export async function getTourOccurrences(
  tourId: number,
  params?: { dateFrom?: string; dateTo?: string }
): Promise<{ items: TourOccurrence[] }> {
  const q = new URLSearchParams();
  if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params?.dateTo) q.set("dateTo", params.dateTo);
  const qs = q.toString();
  return apiClient.get<{ items: TourOccurrence[] }>(`/tours/${tourId}/occurrences${qs ? `?${qs}` : ""}`);
}
