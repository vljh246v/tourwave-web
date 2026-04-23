<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tourwave Web

Tourwave 백엔드(`../tourwave`)의 프론트엔드. 투어/액티비티 운영자·고객 화면을 제공한다.

**백엔드 repo:** `/Users/jaehyun/Documents/workspace/tourwave` (별도 repo, Spring Boot + Kotlin). `docs/openapi.yaml`을 SSOT로 공유한다.

## 작업 진입점

| 작업 유형 | 먼저 읽을 문서 | 시작 명령 |
|-----------|---------------|-----------|
| 새 화면 / 컴포넌트 | `docs/architecture.md` → `docs/golden-principles.md` | `./scripts/task-start.sh <task-id>` |
| API 스키마 변경 동기화 | `docs/architecture.md#api-계약` | `npm run sync:api && npm run gen:api` |
| 고위험 변경 (인증, 라우팅 전반) | `docs/escalation-policy.md` → 사람 승인 | - |

## 스택

- **Next.js 16 (App Router)** — `node_modules/next/dist/docs/` 우선 참조 (위 경고 참조)
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** (PostCSS 플러그인 방식)
- **ESLint** (`eslint-config-next`)
- **openapi-typescript** — 백엔드 OpenAPI → TS 타입 생성

## 빌드 / 테스트 / 린트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # (테스트 러너 미설정 — 첫 단위 테스트 작성 시 vitest 도입)

npm run sync:api     # ../tourwave/docs/openapi.yaml → openapi/openapi.yaml
npm run gen:api      # openapi/openapi.yaml → src/lib/api/schema.ts
```

## API 계약

- **SSOT는 백엔드의 `docs/openapi.yaml`.** 프론트는 절대 손으로 타입을 작성하지 않는다.
- 백엔드 스키마가 바뀌면: `npm run sync:api && npm run gen:api` 실행 후 변경된 `src/lib/api/schema.ts`를 같이 커밋.
- 백엔드는 `OpenApiContractVerificationTest`로 drift를 가드하므로 yaml은 신뢰할 수 있다.
- HTTP 호출은 `src/lib/api/`의 fetch 래퍼만 사용 — 컴포넌트에서 직접 `fetch` 금지 (인증 헤더·에러 매핑 일관성).

## 디렉토리 규칙 (헥사고날 영감)

```
src/
  app/              # Next.js App Router (라우트, 레이아웃, 페이지)
  features/         # 도메인 단위 (예약, 투어, 운영) — UI + 상태 + 사용 케이스
  components/       # 재사용 UI 컴포넌트 (도메인 비종속)
  lib/
    api/            # OpenAPI 생성 타입 + fetch 래퍼
    auth/           # 토큰/세션 유틸
    utils/          # 순수 유틸
```

**의존 방향:** `app → features → components`, 그리고 `features/components → lib`. 역방향 import 금지.

## 핵심 규칙

- **모든 상태 변경 API 호출에 `Idempotency-Key` 헤더 필수** (백엔드 정책). UUID v4 등 고유키를 fetch 래퍼에서 자동 부착.
- **시간 표시는 항상 occurrence의 IANA 타임존 기준**. UTC 문자열을 받아 표시 시 변환. 사용자 로컬 타임존을 가정 금지.
- **인증 토큰은 httpOnly cookie 권장** (SSR 호환). localStorage 사용 시 XSS 위험 명시.
- **에러 응답은 백엔드의 에러코드 컨벤션을 따른다** — `docs/policies.md` (백엔드 repo) 참조.

## 하네스 워크플로우

```
./scripts/task-start.sh <task-id>      # 워크트리 생성
# ... 코드 작성 ...
./scripts/verify-task.sh <task-id>     # 검증만 (병합 안 함)
./scripts/task-finish.sh <task-id>     # 검증 통과 시 develop 병합
```

검증기 5개: build / test / lint / security / docs-freshness. 전부 통과해야 병합.

## 백엔드 repo 위치

`../tourwave` (workspace 옆). OpenAPI 동기화 시 기본 경로로 사용.
