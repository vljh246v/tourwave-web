# 세션 핸드오프 — 2026-04-19

다음 세션에서 이 문서를 먼저 읽고 바로 이어서 진행 가능.

---

## 오늘 한 일 한 줄 요약

Tourwave UI 디자인 방향을 브레인스토밍해서 **디자인 스펙**과 **Foundation 구현 플랜(Plan 1)** 까지 문서화 완료. 코드 구현은 아직 시작 안 함.

---

## 결정된 것들

### 디자인 방향 (확정)

| 항목 | 값 |
|------|-----|
| 스타일 | **Vibrant & Block-based** (Klook × Airbnb Experiences × Nike 느낌) |
| 컬러 | Ocean Blue (`#0EA5E9` primary, `#0369A1` dark) + **오렌지 CTA** (`#EA580C`) |
| 타이포 | Barlow Condensed (헤딩) + Barlow (본문) |
| 플랫폼 | 웹 + 모바일 반응형 (모바일 퍼스트) |
| 고객 네비 | 하단 4탭 (홈·탐색·예약·마이) |
| 운영자 네비 | 데스크탑 사이드바, 모바일 상단 |
| 역할 전환 | 같은 앱 안에서 헤더 드롭다운으로 전환, 승인된 운영자만 가능 |
| 페르소나 | 20-30대 중후반, 레저 스포츠/액티비티, 지출 여력 있음 |

### "촌스러웠던" 이전 목업과 달라진 점

- 카드 배경 그라디언트 → 흰 배경 + 사진 overlay
- 이모지 아이콘 → Lucide SVG (역할 선택 카드만 예외)
- 단조로운 파랑 → Ocean Blue + 오렌지 CTA 대비
- 기본 폰트 → Barlow Condensed로 임팩트

### 범위/실행 순서

3개 플랜으로 분리 결정:

- **Plan 1 — Foundation** (문서 완료, 구현 대기) — 디자인시스템 + 앱 셸 + 로그인
- **Plan 2 — Customer** (스펙만, 플랜 미작성) — 홈 피드, 투어 탐색·상세, 예약 흐름, 예약 내역
- **Plan 3 — Operator** (스펙만, 플랜 미작성) — 대시보드, 투어 관리, 예약 관리

---

## 생성된 파일

### 커밋됨

| 파일 | 내용 |
|------|------|
| `docs/superpowers/specs/2026-04-19-tourwave-ui-design.md` | 전체 UI 설계 스펙 (컬러 토큰, 타이포, IA, 10개 화면 설계) |
| `docs/superpowers/plans/2026-04-19-foundation-design-system-shell.md` | Plan 1 구현 플랜 (8개 태스크, 전체 코드 포함) |
| `design-system/tourwave/MASTER.md` | ui-ux-pro-max 생성 디자인 시스템 마스터 |
| `.gitignore` | `/.superpowers/` 추가 |

### 커밋 안 됨 (브라우저 목업 참고용)

- `.superpowers/brainstorm/44730-1776531491/content/*.html` — 스타일 탐색 목업 (design-system-revised.html이 최종)

---

## 다음 세션 시작 위치

### 바로 이어서 하려면

```bash
# 1. 플랜 문서 읽기
cat docs/superpowers/plans/2026-04-19-foundation-design-system-shell.md

# 2. T-008 (LoginForm) 완료 상태 확인 — Plan 1 Task 5의 의존성
cat docs/exec-plans/active/T-008.md
ls src/features/auth/LoginForm.tsx 2>/dev/null && echo "T-008 완료" || echo "T-008 미완료"

# 3. 구현 시작 — 추천 방식
#    → superpowers:subagent-driven-development 스킬 사용 (fresh subagent per task)
#    → 또는 superpowers:executing-plans (인라인 실행)
```

### Plan 1 Task 순서

1. Barlow 폰트 + globals.css 토큰 (`src/app/layout.tsx`, `src/app/globals.css`)
2. Middleware (`src/middleware.ts` + 테스트)
3. BottomTabBar (`src/components/navigation/`)
4. TopNav + RoleSwitcher (`src/components/navigation/`)
5. **[T-008 의존]** Auth 레이아웃 + 로그인 페이지 (`src/app/(auth)/`)
6. 온보딩 페이지 (`src/app/(auth)/onboarding/`)
7. 고객 셸 (`src/app/(customer)/`)
8. 운영자 셸 (`src/app/(operator)/`)

---

## 주의할 점

- **Tailwind CSS v4**: `tailwind.config.ts` 없음. 컬러/폰트 토큰은 `globals.css`의 `@theme` 블록에서 정의. 플랜 Task 1에 정확히 반영되어 있음.
- **Next.js 16**: AGENTS.md에 "학습 데이터와 다를 수 있다" 경고. 구현 전 `node_modules/next/dist/docs/` 확인 권장.
- **기존 auth 모듈 재사용**: `useAuth()`, `memberships[].roles.includes("OPERATOR")` 패턴이 이미 `src/lib/auth/useAuth.ts`에 있음. 새로 만들지 말고 재사용.
- **T-008 (LoginForm.tsx)** 이 먼저 끝나야 Plan 1 Task 5 진행 가능. 다른 태스크는 독립적.
- **테스트 러너**: T-008에서 vitest + @testing-library/react 설정 예정. Plan 1 테스트도 동일 스택 가정.

---

## 참고 자료 위치

- 디자인 스펙: `docs/superpowers/specs/2026-04-19-tourwave-ui-design.md`
- Plan 1: `docs/superpowers/plans/2026-04-19-foundation-design-system-shell.md`
- 디자인 시스템 마스터: `design-system/tourwave/MASTER.md`
- ui-ux-pro-max 스킬: 이미 Claude Code에 설치됨 (`/plugin install` 완료)
- 아키텍처 문서: `docs/architecture.md`, `docs/golden-principles.md`
