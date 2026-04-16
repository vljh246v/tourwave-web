# Tourwave Web — 아키텍처

## 레이어 구조

```
src/
  app/              # Next.js App Router
                    #   - 라우트 그룹, 레이아웃, page.tsx
                    #   - Server Components 기본, "use client" 명시 시에만 클라이언트
  features/         # 도메인 feature (booking, tour, occurrence, ...)
                    #   - feature 별 UI 컴포넌트 + 훅 + 상태 + 사용 케이스
                    #   - 같은 feature 안에서만 import; cross-feature import 금지
  components/       # 도메인 비종속 재사용 UI (Button, Modal, Form 등)
  lib/
    api/            # OpenAPI 생성 타입 (schema.ts) + fetch 래퍼
    auth/           # 토큰/세션 유틸
    utils/          # 순수 유틸 (날짜, 포맷터 등)
```

## 의존 방향

```
app → features → components
             ↘
              lib  ← components, app
```

- `features` 끼리 직접 import 금지. 공통 의존은 `lib` 또는 `components`로 끌어올린다.
- `lib`은 React/Next 의존 없이 순수 유지를 우선 (특히 `lib/api`, `lib/utils`).

## API 계약

- **SSOT:** 백엔드 `tourwave/docs/openapi.yaml`
- **동기화 흐름:**
  1. 백엔드에서 OpenAPI 변경 (PR로 머지)
  2. 프론트에서 `npm run sync:api` → `openapi/openapi.yaml` 갱신
  3. `npm run gen:api` → `src/lib/api/schema.ts` 재생성
  4. 변경 모두 같은 PR로 커밋
- **fetch 래퍼:** `src/lib/api/client.ts` (예정)
  - `Idempotency-Key` 자동 부착 (write 메서드)
  - 에러 응답을 도메인 에러로 매핑
  - 인증 토큰 자동 부착

## Server vs Client Components

- **Server Components 기본**: 데이터 fetching, DB 접근, 비밀 사용 — 모두 서버에서.
- **`"use client"`는 다음에만**: 인터랙션 핸들러, 브라우저 API, useState/useEffect.
- 서버 → 클라이언트 props는 직렬화 가능한 값만 (함수, 클래스 인스턴스 금지).

## 인증

- 백엔드는 JWT 사용. 프론트 보관 전략: **httpOnly cookie 권장** (SSR Server Component에서 읽기 가능).
- 로그인은 백엔드 `/auth/login` 호출 → 받은 토큰을 Next.js Route Handler에서 `Set-Cookie`로 응답.
- middleware (`middleware.ts`)에서 보호된 경로의 토큰 검증.

## 에러 처리

- 백엔드 에러 응답 형식: `{ code, message, details? }` (정확한 형식은 OpenAPI 참조)
- fetch 래퍼에서 `code`별 분기:
  - `IDEMPOTENCY_KEY_REUSED_*` → 사용자에게 "이미 처리된 요청" 안내
  - `*_FORBIDDEN` → 401/403 처리 (재로그인 등)
  - 그 외 → 토스트/배너로 message 표시

## PR 체크리스트

- [ ] `npm run lint && npm run typecheck` 통과
- [ ] `npm run build` 통과
- [ ] OpenAPI 스키마 변경 시 `src/lib/api/schema.ts`도 함께 갱신
- [ ] feature 간 직접 import 없음
- [ ] `lib/api`에 백엔드 직접 호출 외의 도메인 로직 없음
- [ ] Server/Client 경계 적절 (불필요한 `"use client"` 없음)
- [ ] Idempotency-Key 부착되는 write 호출 누락 없음
