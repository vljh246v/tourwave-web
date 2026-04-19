# Foundation: Design System + App Shell + Auth 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tourwave 디자인 시스템(Barlow 폰트 + 컬러 토큰)을 적용하고, 고객/운영자 분리 앱 셸과 로그인·역할선택 페이지를 구현한다.

**Architecture:** Next.js App Router 라우트 그룹 `(auth)` / `(customer)` / `(operator)` 로 레이아웃 분리. Tailwind CSS v4 `@theme` 블록으로 토큰 정의. `middleware.ts`에서 미인증 요청을 `/login`으로 리다이렉트.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript strict, Lucide React, Vitest + @testing-library/react

**Prerequisites:** T-008 (LoginForm.tsx) 완료 후 시작

---

## 파일 맵

| 파일 | 상태 | 역할 |
|------|------|------|
| `src/app/layout.tsx` | MODIFY | Barlow 폰트 변수 주입, AuthProvider 추가 |
| `src/app/globals.css` | MODIFY | Tailwind v4 `@theme` 블록에 컬러·폰트 토큰 추가 |
| `src/middleware.ts` | CREATE | 미인증 → /login 리다이렉트 |
| `src/app/(auth)/layout.tsx` | CREATE | 로그인·온보딩 공통 레이아웃 (그라디언트 헤더) |
| `src/app/(auth)/login/page.tsx` | CREATE | 로그인 페이지 (LoginForm 사용) |
| `src/app/(auth)/onboarding/page.tsx` | CREATE | 역할 선택 페이지 |
| `src/app/(customer)/layout.tsx` | CREATE | 고객 셸 (TopNav + BottomTabBar) |
| `src/app/(customer)/page.tsx` | CREATE | 고객 홈 placeholder (Plan 2에서 완성) |
| `src/app/(operator)/layout.tsx` | CREATE | 운영자 셸 (TopNav + SideNav) |
| `src/app/(operator)/dashboard/page.tsx` | CREATE | 운영자 대시보드 placeholder (Plan 3에서 완성) |
| `src/components/navigation/BottomTabBar.tsx` | CREATE | 고객 하단 탭바 |
| `src/components/navigation/TopNav.tsx` | CREATE | 공통 상단 네비 |
| `src/components/navigation/RoleSwitcher.tsx` | CREATE | 역할 전환 드롭다운 |
| `src/components/navigation/index.ts` | CREATE | 내보내기 |
| `src/components/navigation/BottomTabBar.test.tsx` | CREATE | 탭 활성 상태 테스트 |
| `src/components/navigation/RoleSwitcher.test.tsx` | CREATE | 역할 조건부 노출 테스트 |
| `src/app/(auth)/onboarding/onboarding.test.tsx` | CREATE | 역할 선택 흐름 테스트 |
| `src/middleware.test.ts` | CREATE | 미인증 리다이렉트 테스트 |

---

## Task 1: Barlow 폰트 + 디자인 시스템 토큰

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: layout.tsx — Geist → Barlow 교체**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tourwave — 액티비티 예약",
  description: "레저 스포츠·액티비티 예약 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${barlowCondensed.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-white font-body text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: globals.css — 컬러·폰트 토큰 추가**

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --color-primary:     #0EA5E9;
  --color-primary-dark:#0369A1;
  --color-secondary:   #38BDF8;
  --color-accent:      #EA580C;
  --color-surface:     #F0F9FF;
  --color-foreground:  #0C4A6E;
  --color-muted:       #64748B;
  --color-border:      #BAE6FD;
  --color-destructive: #DC2626;
}

@theme inline {
  /* 폰트 */
  --font-display: var(--font-display);
  --font-body:    var(--font-body);

  /* 컬러 */
  --color-primary:      var(--color-primary);
  --color-primary-dark: var(--color-primary-dark);
  --color-secondary:    var(--color-secondary);
  --color-accent:       var(--color-accent);
  --color-surface:      var(--color-surface);
  --color-foreground:   var(--color-foreground);
  --color-muted:        var(--color-muted);
  --color-border:       var(--color-border);
  --color-destructive:  var(--color-destructive);
}

/* safe-area 지원 */
@layer base {
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
  .pt-safe { padding-top:    env(safe-area-inset-top); }
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공. 타입 에러·린트 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: Barlow 폰트 + 디자인 시스템 CSS 토큰 적용"
```

---

## Task 2: Middleware (미인증 보호)

**Files:**
- Create: `src/middleware.ts`
- Create: `src/middleware.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/middleware.test.ts
import { describe, it, expect } from "vitest";
import { middleware } from "./middleware";
import { NextRequest } from "next/server";

function makeRequest(path: string, hasCookie = false) {
  const url = `http://localhost${path}`;
  const req = new NextRequest(url);
  if (hasCookie) {
    req.cookies.set("access_token", "mock-token");
  }
  return req;
}

describe("middleware", () => {
  it("미인증 요청은 /login으로 리다이렉트", async () => {
    const res = await middleware(makeRequest("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("/login 접근은 리다이렉트 없음", async () => {
    const res = await middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("인증된 요청은 통과", async () => {
    const res = await middleware(makeRequest("/", true));
    expect(res.status).toBe(200);
  });

  it("/dashboard 미인증 접근 → /login 리다이렉트", async () => {
    const res = await middleware(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- middleware.test
```
Expected: FAIL (middleware.ts 없음)

- [ ] **Step 3: middleware.ts 구현**

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- middleware.test
```
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/middleware.ts src/middleware.test.ts
git commit -m "feat: 미인증 라우트 보호 middleware"
```

---

## Task 3: BottomTabBar 컴포넌트

**Files:**
- Create: `src/components/navigation/BottomTabBar.tsx`
- Create: `src/components/navigation/BottomTabBar.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// src/components/navigation/BottomTabBar.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomTabBar } from "./BottomTabBar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("BottomTabBar", () => {
  it("4개 탭 렌더링", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<BottomTabBar />);
    expect(screen.getByText("홈")).toBeInTheDocument();
    expect(screen.getByText("탐색")).toBeInTheDocument();
    expect(screen.getByText("예약")).toBeInTheDocument();
    expect(screen.getByText("마이")).toBeInTheDocument();
  });

  it("현재 경로 탭이 활성 색상 적용", () => {
    vi.mocked(usePathname).mockReturnValue("/explore");
    render(<BottomTabBar />);
    const exploreLink = screen.getByRole("link", { name: /탐색/i });
    expect(exploreLink).toHaveAttribute("aria-current", "page");
  });

  it("루트(/) 경로에서 홈만 활성", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<BottomTabBar />);
    const homeLink = screen.getByRole("link", { name: /홈/i });
    expect(homeLink).toHaveAttribute("aria-current", "page");
    const exploreLink = screen.getByRole("link", { name: /탐색/i });
    expect(exploreLink).not.toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- BottomTabBar.test
```
Expected: FAIL

- [ ] **Step 3: BottomTabBar 구현**

```tsx
// src/components/navigation/BottomTabBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User } from "lucide-react";

const TABS = [
  { href: "/",         label: "홈",   Icon: Home          },
  { href: "/explore",  label: "탐색", Icon: Search        },
  { href: "/bookings", label: "예약", Icon: ClipboardList  },
  { href: "/my",       label: "마이", Icon: User          },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 탭 메뉴"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white pb-safe"
    >
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 min-h-[56px] flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={20}
                className={active ? "text-primary-dark" : "text-muted"}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] ${
                  active
                    ? "font-semibold text-primary-dark"
                    : "text-muted"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- BottomTabBar.test
```
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/components/navigation/BottomTabBar.tsx src/components/navigation/BottomTabBar.test.tsx
git commit -m "feat: 고객 하단 탭바 컴포넌트"
```

---

## Task 4: TopNav + RoleSwitcher 컴포넌트

**Files:**
- Create: `src/components/navigation/TopNav.tsx`
- Create: `src/components/navigation/RoleSwitcher.tsx`
- Create: `src/components/navigation/RoleSwitcher.test.tsx`
- Create: `src/components/navigation/index.ts`

- [ ] **Step 1: RoleSwitcher 실패 테스트 작성**

```tsx
// src/components/navigation/RoleSwitcher.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoleSwitcher } from "./RoleSwitcher";

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const baseUser = {
  isAuthenticated: true,
  user: { id: 1, name: "테스트", email: "test@test.com" },
  memberships: [],
  logout: mockLogout,
  loading: false,
  error: null,
};

describe("RoleSwitcher", () => {
  it("아바타 클릭 시 드롭다운 열림", () => {
    mockUseAuth.mockReturnValue(baseUser);
    render(<RoleSwitcher mode="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /계정 메뉴/i }));
    expect(screen.getByText("로그아웃")).toBeInTheDocument();
  });

  it("OPERATOR 역할 없는 사용자는 운영자 전환 옵션 미노출", () => {
    mockUseAuth.mockReturnValue({
      ...baseUser,
      memberships: [{ status: "ACTIVE", roles: ["CUSTOMER"] }],
    });
    render(<RoleSwitcher mode="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /계정 메뉴/i }));
    expect(screen.queryByText(/운영자 모드/i)).not.toBeInTheDocument();
  });

  it("OPERATOR 역할 있는 사용자는 운영자 전환 옵션 노출", () => {
    mockUseAuth.mockReturnValue({
      ...baseUser,
      memberships: [{ status: "ACTIVE", roles: ["CUSTOMER", "OPERATOR"] }],
    });
    render(<RoleSwitcher mode="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /계정 메뉴/i }));
    expect(screen.getByText(/운영자 모드/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- RoleSwitcher.test
```
Expected: FAIL

- [ ] **Step 3: RoleSwitcher 구현**

```tsx
// src/components/navigation/RoleSwitcher.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

interface Props {
  mode: "customer" | "operator";
}

export function RoleSwitcher({ mode }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, memberships, logout } = useAuth();

  const isOperator = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles)
    .includes("OPERATOR");

  const initials = user?.name?.[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleSwitch() {
    setOpen(false);
    router.push(mode === "customer" ? "/dashboard" : "/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="계정 메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full bg-primary-dark text-sm font-bold text-white"
      >
        {initials}
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-green-500" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-white p-2 shadow-md"
        >
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {mode === "customer" ? "고객 모드" : "운영자 모드"}
          </p>

          {isOperator && (
            <button
              role="menuitem"
              onClick={handleSwitch}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-surface"
            >
              <ArrowLeftRight size={14} className="text-primary" />
              {mode === "customer" ? "운영자 모드로 전환" : "고객 모드로 전환"}
            </button>
          )}

          <hr className="my-1.5 border-border" />

          <button
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-red-50"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: TopNav 구현**

```tsx
// src/components/navigation/TopNav.tsx
import Link from "next/link";
import { RoleSwitcher } from "./RoleSwitcher";

interface Props {
  mode: "customer" | "operator";
}

export function TopNav({ mode }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white px-4 pt-safe">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between">
        <Link
          href={mode === "customer" ? "/" : "/dashboard"}
          className="font-display text-xl font-extrabold tracking-tight text-primary"
        >
          TOURWAVE
        </Link>
        <RoleSwitcher mode={mode} />
      </div>
    </header>
  );
}
```

- [ ] **Step 5: index.ts 작성**

```ts
// src/components/navigation/index.ts
export { BottomTabBar } from "./BottomTabBar";
export { TopNav } from "./TopNav";
export { RoleSwitcher } from "./RoleSwitcher";
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm test -- RoleSwitcher.test
```
Expected: PASS (3 tests)

- [ ] **Step 7: 커밋**

```bash
git add src/components/navigation/
git commit -m "feat: TopNav + RoleSwitcher 컴포넌트"
```

---

## Task 5: Auth 레이아웃 + 로그인 페이지

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`

> **의존성:** `src/features/auth/LoginForm.tsx` (T-008) 완료 필요

- [ ] **Step 1: (auth) 레이아웃 생성**

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Ocean Blue 그라디언트 헤더 */}
      <div className="flex flex-col items-center bg-gradient-to-br from-primary to-primary-dark px-6 pb-10 pt-16">
        <span className="font-display text-3xl font-extrabold tracking-tight text-white">
          TOURWAVE
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">
          액티비티 예약 플랫폼
        </span>
      </div>

      {/* 흰 카드 (헤더와 겹침) */}
      <div className="-mt-4 flex flex-1 flex-col rounded-t-2xl bg-white px-6 pb-8 pt-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 로그인 페이지 생성**

```tsx
// src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "로그인 — Tourwave" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
        로그인
      </h1>
      <LoginForm />
    </>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/app/(auth)/
git commit -m "feat: Auth 레이아웃 + 로그인 페이지"
```

---

## Task 6: 온보딩 (역할 선택) 페이지

**Files:**
- Create: `src/app/(auth)/onboarding/page.tsx`
- Create: `src/app/(auth)/onboarding/onboarding.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// src/app/(auth)/onboarding/onboarding.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingPage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("OnboardingPage", () => {
  it("두 역할 카드 렌더링", () => {
    mockUseAuth.mockReturnValue({
      memberships: [{ status: "ACTIVE", roles: ["OPERATOR"] }],
    });
    render(<OnboardingPage />);
    expect(screen.getByText("액티비티 즐기기")).toBeInTheDocument();
    expect(screen.getByText("투어 운영하기")).toBeInTheDocument();
  });

  it("OPERATOR 역할 없는 사용자는 운영자 카드 미노출", () => {
    mockUseAuth.mockReturnValue({
      memberships: [{ status: "ACTIVE", roles: ["CUSTOMER"] }],
    });
    render(<OnboardingPage />);
    expect(screen.queryByText("투어 운영하기")).not.toBeInTheDocument();
  });

  it("고객 카드 클릭 시 / 로 이동", () => {
    mockUseAuth.mockReturnValue({
      memberships: [{ status: "ACTIVE", roles: ["CUSTOMER"] }],
    });
    render(<OnboardingPage />);
    fireEvent.click(screen.getByText("액티비티 즐기기"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- onboarding.test
```
Expected: FAIL

- [ ] **Step 3: 온보딩 페이지 구현**

```tsx
// src/app/(auth)/onboarding/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export default function OnboardingPage() {
  const router = useRouter();
  const { memberships } = useAuth();

  const isOperator = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles)
    .includes("OPERATOR");

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          환영합니다! 👋
        </h1>
        <p className="mt-1 text-sm text-muted">어떤 용도로 사용하시나요?</p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-primary bg-surface px-4 py-5 text-center transition hover:bg-primary/5"
      >
        <span className="text-3xl" role="img" aria-label="서핑">🏄</span>
        <span className="font-display text-base font-bold text-primary-dark">
          액티비티 즐기기
        </span>
        <span className="text-xs text-muted">투어 탐색 · 예약 · 관리</span>
      </button>

      {isOperator && (
        <button
          onClick={() => router.push("/dashboard")}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-5 text-center transition hover:bg-surface"
        >
          <span className="text-3xl" role="img" aria-label="오피스">🏢</span>
          <span className="font-display text-base font-bold text-foreground">
            투어 운영하기
          </span>
          <span className="text-xs text-muted">투어 등록 · 예약 관리 · 정산</span>
        </button>
      )}

      <p className="text-center text-xs text-muted">
        나중에 언제든 전환 가능해요
      </p>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- onboarding.test
```
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/app/(auth)/onboarding/
git commit -m "feat: 역할 선택 온보딩 페이지"
```

---

## Task 7: 고객 셸 레이아웃

**Files:**
- Create: `src/app/(customer)/layout.tsx`
- Create: `src/app/(customer)/page.tsx`

- [ ] **Step 1: 고객 레이아웃 생성**

```tsx
// src/app/(customer)/layout.tsx
import { TopNav } from "@/components/navigation/TopNav";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TopNav mode="customer" />
      {/* BottomTabBar(56px) + safe-area만큼 하단 여백 확보 */}
      <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
```

- [ ] **Step 2: 고객 홈 placeholder**

```tsx
// src/app/(customer)/page.tsx
export default function CustomerHomePage() {
  return (
    <div className="flex items-center justify-center p-8 text-muted">
      고객 홈 — Plan 2에서 구현
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/app/(customer)/
git commit -m "feat: 고객 셸 레이아웃 (TopNav + BottomTabBar)"
```

---

## Task 8: 운영자 셸 레이아웃

**Files:**
- Create: `src/app/(operator)/layout.tsx`
- Create: `src/app/(operator)/dashboard/page.tsx`

- [ ] **Step 1: 운영자 레이아웃 생성**

```tsx
// src/app/(operator)/layout.tsx
import Link from "next/link";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Settings,
} from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "대시보드", Icon: LayoutDashboard },
  { href: "/dashboard/tours",    label: "투어 관리", Icon: Map            },
  { href: "/dashboard/bookings", label: "예약 관리", Icon: CalendarCheck  },
  { href: "/dashboard/settings", label: "설정",     Icon: Settings        },
] as const;

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav mode="operator" />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 lg:gap-6 lg:px-6 lg:py-6">
        {/* 사이드바: lg+ 에서만 표시 */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="운영자 사이드 메뉴">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-primary-dark"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 본문 */}
        <main className="flex-1 overflow-hidden px-4 py-4 lg:px-0 lg:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 운영자 대시보드 placeholder**

```tsx
// src/app/(operator)/dashboard/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "대시보드 — Tourwave 운영자" };

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center p-8 text-muted">
      운영자 대시보드 — Plan 3에서 구현
    </div>
  );
}
```

- [ ] **Step 3: 빌드 + 린트 통과 확인**

```bash
npm run build && npm run lint && npm run typecheck
```
Expected: 모두 성공

- [ ] **Step 4: 전체 테스트 확인**

```bash
npm test
```
Expected: 모든 테스트 PASS

- [ ] **Step 5: 최종 커밋**

```bash
git add src/app/(operator)/
git commit -m "feat: 운영자 셸 레이아웃 (사이드바 + TopNav)"
```

---

## 완료 기준 체크리스트

- [ ] `npm run build` 성공
- [ ] `npm test` 전체 통과 (middleware, BottomTabBar, RoleSwitcher, Onboarding)
- [ ] `npm run lint && npm run typecheck` 통과
- [ ] `/login` 페이지: 그라디언트 헤더 + 흰 폼 카드 렌더링
- [ ] `/onboarding`: OPERATOR 역할 없는 계정에서 운영자 카드 미노출
- [ ] 고객 페이지(`/`)에서 하단 탭바 4개 렌더링, 활성 탭 하이라이트
- [ ] 운영자 페이지(`/dashboard`) 데스크탑에서 사이드바 표시, 모바일에서 숨김
- [ ] 미인증 상태에서 `/` 접근 시 `/login`으로 리다이렉트

---

## 다음 플랜

- **Plan 2 — Customer Experience:** 고객 홈 피드, 투어 탐색·상세, 예약 흐름, 예약 내역 + QR
- **Plan 3 — Operator Experience:** 운영자 대시보드, 투어 관리(occurrence), 예약 관리
