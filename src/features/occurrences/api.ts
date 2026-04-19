import { apiClient } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type TourOccurrence = components["schemas"]["TourOccurrence"];
export type OccurrenceDetail = components["schemas"]["OccurrenceDetail"];
export type OccurrenceSearchItem = components["schemas"]["OccurrenceSearchItem"];
export type OccurrenceSearchResponse = components["schemas"]["OccurrenceSearchResponse"];
export type QuoteResponse = components["schemas"]["QuoteResponse"];
export type AvailabilityResponse = components["schemas"]["AvailabilityResponse"];

export type SortOption = "START_AT_ASC" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";

export interface SearchParams {
  dateFrom: string;
  dateTo: string;
  timezone?: string;
  location?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  onlyAvailable?: boolean;
  sort?: SortOption;
  includeRating?: boolean;
  limit?: number;
  cursor?: string;
}

export async function searchOccurrences(
  params: SearchParams
): Promise<OccurrenceSearchResponse> {
  const q = new URLSearchParams();
  q.set("dateFrom", params.dateFrom);
  q.set("dateTo", params.dateTo);
  if (params.timezone) q.set("timezone", params.timezone);
  if (params.location) q.set("location", params.location);
  if (params.categoryId != null) q.set("categoryId", String(params.categoryId));
  if (params.priceMin != null) q.set("priceMin", String(params.priceMin));
  if (params.priceMax != null) q.set("priceMax", String(params.priceMax));
  if (params.onlyAvailable != null) q.set("onlyAvailable", String(params.onlyAvailable));
  if (params.sort) q.set("sort", params.sort);
  if (params.includeRating != null) q.set("includeRating", String(params.includeRating));
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.cursor) q.set("cursor", params.cursor);
  return apiClient.get<OccurrenceSearchResponse>(`/search/occurrences?${q.toString()}`);
}

export async function getOccurrence(occurrenceId: number): Promise<OccurrenceDetail> {
  return apiClient.get<OccurrenceDetail>(`/occurrences/${occurrenceId}`);
}

export async function getQuote(
  occurrenceId: number,
  partySize: number
): Promise<QuoteResponse> {
  return apiClient.get<QuoteResponse>(
    `/occurrences/${occurrenceId}/quote?partySize=${partySize}`
  );
}
