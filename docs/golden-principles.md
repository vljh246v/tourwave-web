# Golden Principles — Tourwave Web

> 반복 실패에서 승격된 누적 규칙. 새로운 것이 발견되면 추가.

## 0. 시작은 비어 있음

이 문서는 점진적으로 채워진다. 첫 실패가 발생하면 `docs/agent-failures.md`에 기록하고, 패턴이 반복되면 여기로 승격한다.

## (예시) 향후 추가될 항목 카테고리

- **API 계약 동기화**: 백엔드 OpenAPI 변경 누락으로 인한 런타임 실패
- **Server/Client 경계**: 클라이언트 전용 코드를 Server Component에 넣어 빌드 실패
- **Tailwind v4 전환**: `@tailwindcss/postcss` 플러그인 방식 — JIT 설정 변경 함정
- **Next.js 16 변경점**: 캐시 정책, fetch 옵션, App Router 변경사항
- **Idempotency-Key**: 누락 시 백엔드가 422 — write 호출 일관성

(첫 실패가 발생하면 위 카테고리 형식으로 구체화)
