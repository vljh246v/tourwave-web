# Failure Patterns — 최근 실패 추이 (Feedforward)

> task-start.sh가 자동으로 첫 20줄을 읽어 다음 작업의 컨텍스트로 주입한다.
> 같은 실수를 반복하지 않도록 가장 최근/빈번한 실패 패턴을 상단에 유지하라.

## 가장 최근 실패 패턴

(아직 없음)

## 자주 일어나는 함정 (선험적)

- **Tailwind v4**: `tailwind.config.js` 없이 PostCSS 플러그인 방식. 기존 v3 가이드와 다름.
- **Next.js 16**: App Router 캐시 정책 변경. `fetch` 옵션 확인 필요.
- **Server/Client 경계**: 잘못 두면 빌드 시점이 아니라 런타임에 터지는 경우 있음.
- **OpenAPI 동기화**: 백엔드 머지 직후 `npm run sync:api && npm run gen:api` 빠뜨리면 타입 mismatch.
