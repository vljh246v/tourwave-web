import { render, screen } from "@testing-library/react";
import { TourCard } from "./TourCard";
import type { OccurrenceSearchItem } from "@/features/occurrences/api";

const mockItem: OccurrenceSearchItem = {
  occurrence: {
    id: 1,
    tourId: 10,
    organizationId: 100,
    status: "SCHEDULED",
    timezone: "Asia/Seoul",
    startAtUtc: "2026-04-25T09:00:00Z",
    endAtUtc: "2026-04-25T11:00:00Z",
    capacity: 8,
    price: { amount: 50000, currency: "KRW" },
    createdAt: "2026-04-01T00:00:00Z",
  },
  tour: {
    id: 10,
    organizationId: 100,
    status: "PUBLISHED",
    title: "제주 스쿠버 다이빙",
    locationText: "제주시",
    categoryId: 1,
    formatId: 1,
    coverImageUrl: null,
    createdAt: "2026-04-01T00:00:00Z",
  },
};

describe("TourCard", () => {
  it("renders tour title", () => {
    render(<TourCard item={mockItem} />);
    expect(screen.getByText("제주 스쿠버 다이빙")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<TourCard item={mockItem} />);
    expect(screen.getByText("제주시")).toBeInTheDocument();
  });

  it("renders price in KRW format", () => {
    render(<TourCard item={mockItem} />);
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it("shows placeholder when no coverImageUrl", () => {
    render(<TourCard item={mockItem} />);
    const placeholder = screen.getByTestId("tour-card-placeholder");
    expect(placeholder).toBeInTheDocument();
  });

  it("renders cover image when provided", () => {
    const withImage = {
      ...mockItem,
      tour: { ...mockItem.tour, coverImageUrl: "https://example.com/photo.jpg" },
    };
    render(<TourCard item={withImage} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", expect.stringContaining("photo.jpg"));
  });

  it("renders rating when ratingSummary provided", () => {
    const withRating = { ...mockItem, ratingSummary: { avgRating: 4.5, reviewCount: 12 } };
    render(<TourCard item={withRating} />);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
  });
});
