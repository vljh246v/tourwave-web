# Escalation Policy — Tourwave Web

다음 변경은 **사람의 명시적 승인** 후 진행한다. 에이전트가 자동으로 머지하지 않는다.

## 사람 승인 필수

1. **인증/세션 흐름 변경** — 토큰 저장 위치, middleware 보호 정책, 로그인 UX 전환
2. **라우팅 구조 전반 개편** — `app/` 디렉토리 그룹 재배치, public/protected 경계 변경
3. **번들/빌드 도구 교체** — Next.js 메이저 업그레이드, Tailwind 메이저 업그레이드, ESLint config 교체
4. **CSP / CORS 관련 변경** — 새 외부 호스트 허용
5. **백엔드 API 계약 변경 요청** — `openapi.yaml` 변경은 백엔드 repo PR로
6. **분석/추적 코드 추가** — 사용자 데이터 수집 도입

## 절차

1. 변경 의도와 영향 범위를 docs/exec-plans/active/ 에 기록
2. 사람 리뷰 → 승인 댓글
3. 승인 후 작업 진행, 검증 통과 시 머지
