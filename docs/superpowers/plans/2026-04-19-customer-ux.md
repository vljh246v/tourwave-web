# Plan 2 — Customer UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고객 모드의 전체 화면(홈·탐색·투어 상세·예약 흐름·예약 내역·마이페이지)을 구현한다.

**Architecture:** 모든 고객 페이지는 Client Component(`"use client"`)로 구현한다 — auth 상태(httpOnly cookie)를 브라우저에서 읽어야 하고, 인터랙션이 많기 때문이다. API 호출은 `src/lib/api/client.ts`의 `apiClient`만 사용한다. 각 도메인(tours, occurrences, bookings)은 `src/features/{domain}/api.ts`에서 API 함수를 관리한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, lucide-react, qrcode.react (신규 설치), vitest + @testing-library/react

---

## 기존 구현 상태 (Plan 1 완료)

| 파일 | 상태 |
|------|------|
| `src/app/(customer)/layout.tsx` | stub (TopNav + BottomTabBar) |
| `src/app/(customer)/page.tsx` | placeholder ("Plan 2에서 구현") |
| `src/app/(customer)/explore/page.tsx` | placeholder |
| `src/components/ui/` | Button, Card, FormField, Input, Modal 완료 |
| `src/lib/api/client.ts` | apiClient (GET/POST/PATCH/DELETE, Idempotency-Key 자동 부착) |
| `src/lib/auth/useAuth.ts` | useAuth(), useAuthGuard() 완료 |
| `src/app/globals.css` | 컬러 토큰, Barlow 폰트 토큰 완료 |

---

## 파일 맵

### 신규 생성

| 파일 | 역할 |
|------|------|
| `src/lib/utils/money.ts` | KRW 등 금액 포맷 유틸 |
| `src/lib/utils/time.ts` | IANA 타임존 기반 날짜/시간 포맷 유틸 |
| `src/lib/auth/ClientAuthGuard.tsx` | 미인증 시 /login 리다이렉트 |
| `src/features/tours/api.ts` | getTours(), getTour(), getTourOccurrences() |
| `src/features/tours/TourCard.tsx` | 투어 카드 (사진+제목+위치+가격+별점) |
| `src/features/tours/TourCard.test.tsx` | TourCard 단위 테스트 |
| `src/features/tours/TourCardSkeleton.tsx` | 로딩 스켈레톤 |
| `src/features/occurrences/api.ts` | searchOccurrences(), getOccurrence(), getQuote() |
| `src/features/bookings/api.ts` | createBooking(), getMyBookings(), getBooking(), cancelBooking() |
| `src/features/bookings/BookingCard.tsx` | 예약 목록 카드 |
| `src/features/bookings/BookingCard.test.tsx` | BookingCard 단위 테스트 |
| `src/features/bookings/QRModal.tsx` | QR 티켓 모달 |
| `src/app/(customer)/tours/[id]/page.tsx` | 투어 상세 페이지 |
| `src/app/(customer)/tours/[id]/book/page.tsx` | 예약 흐름 (3단계) |
| `src/app/(customer)/bookings/page.tsx` | 예약 내역 |
| `src/app/(customer)/my/page.tsx` | 마이페이지 |

### 수정

| 파일 | 변경 |
|------|------|
| `src/app/(customer)/layout.tsx` | ClientAuthGuard 래퍼 추가 |
| `src/app/(customer)/page.tsx` | 홈 피드 구현 |
| `src/app/(customer)/explore/page.tsx` | 탐색/검색 구현 |
| `src/app/globals.css` | `.no-scrollbar` 유틸 추가 |

---

### Task 1: 패키지 설치 + 유틸리티 + API 레이어

**Files:**
- Install: `qrcode.react`
- Create: `src/lib/utils/money.ts`
- Create: `src/lib/utils/time.ts`
- Create: `src/features/tours/api.ts`
- Create: `src/features/occurrences/api.ts`
- Create: `src/features/bookings/api.ts`

- [ ] **Step 1: qrcode.react 설치**

```bash
npm install qrcode.react
```

Expected: `package.json`에 `"qrcode.react"` 추가됨.

- [ ] **Step 2: money 유틸 작성**

`src/lib/utils/money.ts`:
```typescript
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(amount);
}
```

- [ ] **Step 3: time 유틸 작성**

`src/lib/utils/time.ts`:
```typescript
export function formatInTimezone(
  utcString: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: timezone, ...options }).format(
    new Date(utcString)
  );
}

export function dateRangeFromNow(daysAhead: number): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + daysAhead);
  return { dateFrom: now.toISOString(), dateTo: future.toISOString() };
}
```

- [ ] **Step 4: tours API 레이어 작성**

`src/features/tours/api.ts`:
```typescript
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
```

- [ ] **Step 5: occurrences API 레이어 작성**

`src/features/occurrences/api.ts`:
```typescript
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
```

- [ ] **Step 6: bookings API 레이어 작성**

`src/features/bookings/api.ts`:
```typescript
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
  // BookingListResponse.items is loosely typed as {[key:string]:unknown}[]; cast to Booking[] is safe.
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
```

- [ ] **Step 7: globals.css에 no-scrollbar 추가**

`src/app/globals.css`의 `@layer base { ... }` 블록 아래에 추가:
```css
@layer utilities {
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 8: typecheck 통과 확인**

```bash
npm run typecheck
```

Expected: 에러 없음.

- [ ] **Step 9: 커밋**

```bash
git add src/lib/utils/money.ts src/lib/utils/time.ts \
  src/features/tours/api.ts src/features/occurrences/api.ts \
  src/features/bookings/api.ts src/app/globals.css \
  package.json package-lock.json
git commit -m "feat: Plan 2 — API layer + money/time utils"
```

---

### Task 2: TourCard + TourCardSkeleton 컴포넌트

**Files:**
- Create: `src/features/tours/TourCard.tsx`
- Create: `src/features/tours/TourCardSkeleton.tsx`
- Create: `src/features/tours/TourCard.test.tsx`

TourCard는 `OccurrenceSearchItem` 데이터를 받아 카드를 렌더링한다. 이미지 없을 경우 Ocean Blue 플레이스홀더 표시.

- [ ] **Step 1: 실패 테스트 작성**

`src/features/tours/TourCard.test.tsx`:
```typescript
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
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- TourCard
```

Expected: FAIL (TourCard not found)

- [ ] **Step 3: TourCard 구현**

`src/features/tours/TourCard.tsx`:
```tsx
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";
import type { OccurrenceSearchItem } from "@/features/occurrences/api";

interface TourCardProps {
  item: OccurrenceSearchItem;
  className?: string;
}

export function TourCard({ item, className = "" }: TourCardProps) {
  const { tour, occurrence, ratingSummary } = item;

  return (
    <div
      className={[
        "rounded-xl overflow-hidden bg-white shadow-sm border border-border flex-shrink-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative h-40 w-full bg-primary">
        {tour.coverImageUrl ? (
          <Image
            src={tour.coverImageUrl}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 256px, 320px"
          />
        ) : (
          <div
            data-testid="tour-card-placeholder"
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark"
          >
            <span className="font-display text-sm font-bold tracking-widest text-white/60 uppercase">
              Tourwave
            </span>
          </div>
        )}
        {ratingSummary && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-white">
              {ratingSummary.avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-display text-base font-bold leading-tight text-foreground line-clamp-2">
          {tour.title}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-muted">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="text-xs truncate">{tour.locationText}</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-primary-dark">
          {formatMoney(occurrence.price.amount, occurrence.price.currency)}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: TourCardSkeleton 구현**

`src/features/tours/TourCardSkeleton.tsx`:
```tsx
export function TourCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "rounded-xl overflow-hidden bg-white shadow-sm border border-border flex-shrink-0 animate-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="h-40 w-full bg-surface" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-surface" />
        <div className="h-3 w-1/2 rounded bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 테스트 실행 → 통과 확인**

```bash
npm test -- TourCard
```

Expected: 6 tests PASS

- [ ] **Step 6: lint + typecheck**

```bash
npm run lint && npm run typecheck
```

Expected: 에러 없음.

- [ ] **Step 7: 커밋**

```bash
git add src/features/tours/TourCard.tsx src/features/tours/TourCardSkeleton.tsx \
  src/features/tours/TourCard.test.tsx
git commit -m "feat: TourCard + TourCardSkeleton 컴포넌트"
```

---

### Task 3: ClientAuthGuard + 홈 페이지

**Files:**
- Create: `src/lib/auth/ClientAuthGuard.tsx`
- Modify: `src/app/(customer)/layout.tsx`
- Modify: `src/app/(customer)/page.tsx`

홈 페이지: 검색바 + 카테고리 칩 + 3개 가로스크롤 섹션 (인기/인근/저렴).

- [ ] **Step 1: ClientAuthGuard 작성**

`src/lib/auth/ClientAuthGuard.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
```

- [ ] **Step 2: customer layout에 AuthGuard 추가**

`src/app/(customer)/layout.tsx` 전체 교체:
```tsx
import { TopNav } from "@/components/navigation/TopNav";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { ClientAuthGuard } from "@/lib/auth/ClientAuthGuard";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthGuard>
      <div className="flex min-h-dvh flex-col bg-white">
        <TopNav mode="customer" />
        <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </ClientAuthGuard>
  );
}
```

- [ ] **Step 3: 홈 페이지 구현**

`src/app/(customer)/page.tsx` 전체 교체:
```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TourCard } from "@/features/tours/TourCard";
import { TourCardSkeleton } from "@/features/tours/TourCardSkeleton";
import { searchOccurrences } from "@/features/occurrences/api";
import { dateRangeFromNow } from "@/lib/utils/time";
import type { OccurrenceSearchItem } from "@/features/occurrences/api";

interface Section {
  title: string;
  items: OccurrenceSearchItem[];
  loading: boolean;
}

export default function CustomerHomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { title: "지금 예약 가능", items: [], loading: true },
    { title: "인기 액티비티", items: [], loading: true },
    { title: "가성비 액티비티", items: [], loading: true },
  ]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const { dateFrom, dateTo } = dateRangeFromNow(30);
    const base = { dateFrom, dateTo, limit: 10, includeRating: true };

    Promise.allSettled([
      searchOccurrences({ ...base, sort: "START_AT_ASC" }),
      searchOccurrences({ ...base, sort: "RATING_DESC" }),
      searchOccurrences({ ...base, sort: "PRICE_ASC" }),
    ]).then(([upcoming, popular, cheap]) => {
      setSections([
        {
          title: "지금 예약 가능",
          items: upcoming.status === "fulfilled" ? upcoming.value.items : [],
          loading: false,
        },
        {
          title: "인기 액티비티",
          items: popular.status === "fulfilled" ? popular.value.items : [],
          loading: false,
        },
        {
          title: "가성비 액티비티",
          items: cheap.status === "fulfilled" ? cheap.value.items : [],
          loading: false,
        },
      ]);
    });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/explore?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="pb-4">
      {/* 검색바 */}
      <div className="bg-gradient-to-b from-primary to-primary-dark px-4 pb-6 pt-4">
        <p className="mb-3 font-display text-sm font-semibold tracking-wide text-white/80 uppercase">
          오늘 어떤 액티비티를 찾으세요?
        </p>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="지역·투어명 검색"
            className="w-full rounded-xl bg-white py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      {/* 탐색 링크 */}
      <div className="px-4 py-3">
        <button
          onClick={() => router.push("/explore")}
          className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors min-h-[44px]"
        >
          전체 투어 탐색하기
        </button>
      </div>

      {/* 섹션들 */}
      {sections.map((section) => (
        <div key={section.title} className="mt-2">
          <div className="flex items-baseline justify-between px-4 pb-2">
            <h2 className="font-display text-lg font-bold text-foreground">
              {section.title}
            </h2>
            <button
              onClick={() => router.push("/explore")}
              className="text-xs text-primary"
            >
              더보기
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {section.loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TourCardSkeleton key={i} className="w-56" />
                ))
              : section.items.length === 0
              ? <p className="text-sm text-muted py-4">항목이 없습니다.</p>
              : section.items.map((item) => (
                  <button
                    key={`${item.occurrence.id}`}
                    onClick={() => router.push(`/tours/${item.tour.id}`)}
                    className="text-left"
                  >
                    <TourCard item={item} className="w-56" />
                  </button>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: typecheck**

```bash
npm run typecheck
```

Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/auth/ClientAuthGuard.tsx \
  src/app/(customer)/layout.tsx \
  src/app/(customer)/page.tsx
git commit -m "feat: ClientAuthGuard + 고객 홈 피드"
```

---

### Task 4: 탐색 (Explore) 페이지

**Files:**
- Modify: `src/app/(customer)/explore/page.tsx`

URL 파라미터: `?q=location&sort=START_AT_ASC&priceMin=N&priceMax=M`  
`dateFrom`/`dateTo`는 오늘~+30일 기본값 사용.

- [ ] **Step 1: Explore 페이지 구현**

`src/app/(customer)/explore/page.tsx` 전체 교체:
```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, MapPin, Star, X } from "lucide-react";
import Image from "next/image";
import { searchOccurrences } from "@/features/occurrences/api";
import { dateRangeFromNow, formatInTimezone } from "@/lib/utils/time";
import { formatMoney } from "@/lib/utils/money";
import { TourCardSkeleton } from "@/features/tours/TourCardSkeleton";
import type { OccurrenceSearchItem, SortOption } from "@/features/occurrences/api";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "일정 빠른 순", value: "START_AT_ASC" },
  { label: "평점 높은 순", value: "RATING_DESC" },
  { label: "가격 낮은 순", value: "PRICE_ASC" },
  { label: "가격 높은 순", value: "PRICE_DESC" },
];

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortOption>("START_AT_ASC");
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [items, setItems] = useState<OccurrenceSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchResults = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      setLoading(true);
      setError(null);
      const { dateFrom, dateTo } = dateRangeFromNow(30);
      try {
        const res = await searchOccurrences({
          dateFrom,
          dateTo,
          location: query || undefined,
          sort,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          includeRating: true,
          limit: 20,
          onlyAvailable: true,
          cursor: opts.reset ? undefined : (nextCursor ?? undefined),
        });
        if (opts.reset) {
          setItems(res.items);
        } else {
          setItems((prev) => [...prev, ...res.items]);
        }
        setNextCursor(res.nextCursor ?? null);
      } catch {
        setError("검색 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [query, sort, priceMin, priceMax, nextCursor]
  );

  useEffect(() => {
    fetchResults({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, priceMin, priceMax]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchResults({ reset: true });
  }

  return (
    <div className="flex flex-col">
      {/* 검색 헤더 */}
      <div className="sticky top-[56px] z-30 border-b border-border bg-white px-4 py-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="지역·투어명 검색"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="최소 금액"
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
              <span className="text-muted">~</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="최대 금액"
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* 결과 목록 */}
      <div className="divide-y divide-border">
        {loading && items.length === 0 ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <TourCardSkeleton key={i} className="w-full h-28" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            {items.map((item) => (
              <button
                key={item.occurrence.id}
                onClick={() =>
                  router.push(
                    `/tours/${item.tour.id}?occurrenceId=${item.occurrence.id}`
                  )
                }
                className="flex w-full gap-3 p-4 text-left hover:bg-surface active:bg-surface transition-colors"
              >
                <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-primary">
                  {item.tour.coverImageUrl ? (
                    <Image
                      src={item.tour.coverImageUrl}
                      alt={item.tour.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-primary-dark" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-bold text-foreground truncate">
                    {item.tour.title}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1 text-muted">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs truncate">{item.tour.locationText}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatInTimezone(item.occurrence.startAtUtc, item.occurrence.timezone)}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-dark">
                      {formatMoney(
                        item.occurrence.price.amount,
                        item.occurrence.price.currency
                      )}
                    </span>
                    {item.ratingSummary && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted">
                          {item.ratingSummary.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {nextCursor && (
              <div className="p-4">
                <button
                  onClick={() => fetchResults()}
                  disabled={loading}
                  className="w-full rounded-xl border border-border py-3 text-sm text-foreground hover:bg-surface disabled:opacity-50"
                >
                  {loading ? "불러오는 중..." : "더보기"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: typecheck**

```bash
npm run typecheck
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/app/(customer)/explore/page.tsx
git commit -m "feat: 투어 탐색(Explore) 페이지 — 검색+필터+정렬"
```

---

### Task 5: 투어 상세 페이지

**Files:**
- Create: `src/app/(customer)/tours/[id]/page.tsx`

투어 상세: 히어로 이미지 + 기본 정보 + 다가오는 일정 목록 + 고정 하단 CTA 바.

- [ ] **Step 1: 디렉토리 생성 확인**

```bash
mkdir -p src/app/\(customer\)/tours/\[id\]
```

- [ ] **Step 2: 투어 상세 페이지 구현**

`src/app/(customer)/tours/[id]/page.tsx`:
```tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, MapPin, Star, Users, Clock, ChevronRight } from "lucide-react";
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
      {/* 히어로 이미지 */}
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

      {/* 콘텐츠 */}
      <div className="px-4 pt-4">
        <h1 className="font-display text-2xl font-extrabold leading-tight text-foreground">
          {tour.title}
        </h1>
        {tour.subtitle && (
          <p className="mt-1 text-sm text-muted">{tour.subtitle}</p>
        )}

        {/* 통계 */}
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

        {/* 강사 */}
        {tour.instructors && tour.instructors.length > 0 && (
          <div className="mt-4">
            <h2 className="font-display text-base font-bold text-foreground">강사</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {tour.instructors.map((inst) => (
                <span
                  key={inst.id}
                  className="rounded-full bg-surface px-3 py-1 text-xs text-foreground"
                >
                  {inst.displayName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 다가오는 일정 */}
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

      {/* 고정 하단 바 */}
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
```

참고: `InstructorPublicProfile` 스키마에 `id`, `displayName` 필드가 있다. typecheck에서 에러가 날 경우 `inst.id` → `inst.userId` 등 스키마 필드명을 확인한다.

- [ ] **Step 3: typecheck**

```bash
npm run typecheck
```

Expected: 에러 없음. 에러 발생 시 `src/lib/api/schema.ts`의 `InstructorPublicProfile` 스키마를 확인해 필드명 수정.

- [ ] **Step 4: 커밋**

```bash
git add src/app/\(customer\)/tours/
git commit -m "feat: 투어 상세 페이지 — 일정 선택 포함"
```

---

### Task 6: 예약 흐름 (3단계)

**Files:**
- Create: `src/app/(customer)/tours/[id]/book/page.tsx`

3단계: 일정 확인 → 인원 선택 → 예약 확인. MVP에서 결제는 가상(백엔드 `amountPaid`가 Virtual).

- [ ] **Step 1: 디렉토리 생성 확인**

```bash
mkdir -p "src/app/(customer)/tours/[id]/book"
```

- [ ] **Step 2: 예약 흐름 페이지 구현**

`src/app/(customer)/tours/[id]/book/page.tsx`:
```tsx
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

  // 성공 화면
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
      {/* 헤더 */}
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

      {/* Step 1: 일정 확인 */}
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

      {/* Step 2: 인원 선택 */}
      {step === 2 && selectedOcc && (
        <div className="px-4 py-4">
          <h2 className="font-display text-lg font-bold text-foreground">인원 선택</h2>
          <p className="mt-1 text-sm text-muted">
            최대 {selectedOcc.capacity}명
          </p>
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

      {/* Step 3: 예약 확인 */}
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

      {/* 하단 CTA */}
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
```

- [ ] **Step 3: typecheck**

```bash
npm run typecheck
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(customer)/tours/"
git commit -m "feat: 예약 흐름 3단계 — 일정·인원·확인"
```

---

### Task 7: 예약 내역 + BookingCard + QRModal

**Files:**
- Create: `src/features/bookings/BookingCard.tsx`
- Create: `src/features/bookings/BookingCard.test.tsx`
- Create: `src/features/bookings/QRModal.tsx`
- Create: `src/app/(customer)/bookings/page.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/features/bookings/BookingCard.test.tsx`:
```typescript
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
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test -- BookingCard
```

Expected: FAIL (BookingCard not found)

- [ ] **Step 3: BookingCard 구현**

`src/features/bookings/BookingCard.tsx`:
```tsx
import { QrCode, ChevronRight } from "lucide-react";
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
```

- [ ] **Step 4: QRModal 구현**

`src/features/bookings/QRModal.tsx`:
```tsx
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
```

- [ ] **Step 5: 테스트 실행 → 통과 확인**

```bash
npm test -- BookingCard
```

Expected: 7 tests PASS

- [ ] **Step 6: 예약 내역 페이지 구현**

`src/app/(customer)/bookings/page.tsx`:
```tsx
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
    setLoading(true);
    setBookings([]);
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

  return (
    <div>
      {/* 탭 */}
      <div className="sticky top-[56px] z-30 flex border-b border-border bg-white">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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

      {/* 목록 */}
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

      {/* QR 모달 */}
      {qrBookingId !== null && (
        <QRModal bookingId={qrBookingId} onClose={() => setQrBookingId(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 7: typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: 에러 없음.

- [ ] **Step 8: 커밋**

```bash
git add src/features/bookings/ src/app/\(customer\)/bookings/
git commit -m "feat: 예약 내역 페이지 + BookingCard + QR 모달"
```

---

### Task 8: 마이페이지

**Files:**
- Create: `src/app/(customer)/my/page.tsx`

사용자 정보 + 로그아웃 + 운영자 전환 버튼 (OPERATOR 역할 보유 시).

- [ ] **Step 1: 마이페이지 구현**

`src/app/(customer)/my/page.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { User, LogOut, ChevronRight, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

export default function MyPage() {
  const { user, memberships, logout } = useAuth();
  const router = useRouter();

  const hasOperatorRole = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles)
    .includes("OPERATOR");

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="p-4">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 rounded-xl bg-surface p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
          <User className="h-7 w-7 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-foreground truncate">
            {user?.displayName ?? user?.email ?? "사용자"}
          </p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
        </div>
      </div>

      {/* 운영자 모드 전환 */}
      {hasOperatorRole && (
        <div className="mt-4">
          <button
            onClick={() => router.push("/operator")}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 min-h-[44px] hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">운영자 모드로 전환</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
        </div>
      )}

      {/* 알림 설정 (MVP placeholder) */}
      <div className="mt-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 opacity-50">
          <span className="text-sm text-foreground">알림 설정</span>
          <span className="text-xs text-muted">준비 중</span>
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-white px-4 py-3.5 min-h-[44px] text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-semibold">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
```

참고: `User` 스키마 필드는 `email: string`, `displayName: string`으로 확인됨 (`src/lib/api/schema.ts:5728`).

- [ ] **Step 3: typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: 에러 없음.

- [ ] **Step 4: 전체 테스트 실행**

```bash
npm test
```

Expected: 모든 테스트 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/app/\(customer\)/my/page.tsx
git commit -m "feat: 마이페이지 — 프로필·운영자 전환·로그아웃"
```

---

### Task 9: 최종 검증 + BottomTabBar 경로 확인

**Files:**
- Verify: `src/components/navigation/BottomTabBar.tsx`
- Modify if needed: `src/components/navigation/BottomTabBar.tsx`

- [ ] **Step 1: 전체 테스트 실행**

참고: `BottomTabBar`는 Plan 1에서 `/`, `/explore`, `/bookings`, `/my` 4개 탭을 이미 포함함. 수정 불필요.

```bash
npm test
```

Expected: 모든 테스트 통과.

- [ ] **Step 2: 빌드 통과 확인**

```bash
npm run build
```

Expected: 빌드 성공. `next.config.ts`의 Image domains 설정이 필요할 경우 (`next/image`가 외부 URL을 거부하면) `remotePatterns` 추가:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async rewrites() { ... }
};
```

- [ ] **Step 3: lint + typecheck**

```bash
npm run lint && npm run typecheck
```

Expected: 에러 없음.

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat: Plan 2 Customer UX 완료 — 홈·탐색·투어상세·예약·예약내역·마이"
```

---

## 완료 기준 체크리스트

- [ ] `npm test` — 모든 테스트 통과 (TourCard 6개, BookingCard 7개 포함)
- [ ] `npm run build` — 빌드 성공
- [ ] `npm run typecheck` — 에러 없음
- [ ] `npm run lint` — 에러 없음
- [ ] `/` 홈 페이지: 검색바 + 카테고리 칩 + 3개 가로스크롤 섹션
- [ ] `/explore` 탐색: 검색 + 필터 + 결과 목록
- [ ] `/tours/[id]` 투어 상세: 히어로 + 일정 선택 + 하단 CTA
- [ ] `/tours/[id]/book` 예약 흐름: 3단계 완료 후 성공 화면
- [ ] `/bookings` 예약 내역: 탭 + QR 모달
- [ ] `/my` 마이페이지: 프로필 + 로그아웃
- [ ] 미인증 접근 시 `/login` 리다이렉트

## 알려진 MVP 제한사항

- 카테고리 칩은 `location` 텍스트 검색으로 연결됨 (API에 `/categories` 엔드포인트 없음)
- 예약 내역 카드에 투어명 미표시 (N+1 문제 회피 — occurrenceId만 표시)
- 결제는 가상(백엔드 MVP 정책)
- 알림 설정 미구현
