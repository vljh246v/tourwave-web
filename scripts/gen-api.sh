#!/usr/bin/env bash
# =============================================================================
# gen-api.sh — OpenAPI → TypeScript 타입 생성 파이프라인
#
# 사용법:
#   ./scripts/gen-api.sh             # sync:api → gen:api 실행
#   ./scripts/gen-api.sh --check-only  # drift 감지만 (변경 없음, CI용)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CHECK_ONLY=false
for arg in "$@"; do
  [[ "$arg" == "--check-only" ]] && CHECK_ONLY=true
done

cd "$PROJECT_ROOT"

# 1. OpenAPI 스펙 동기화
echo "[gen-api] 1/3 OpenAPI 스펙 동기화..."
if ! npm run sync:api 2>&1; then
  echo "[ERROR] sync:api 실패. 백엔드 경로를 확인하세요 (기본: ../tourwave)"
  exit 1
fi

# 2. 체크 전용 모드: 임시 파일로 생성 후 diff
if $CHECK_ONLY; then
  echo "[gen-api] 2/3 타입 drift 검사 중 (--check-only)..."
  TMP_FILE="$(mktemp /tmp/schema-check-XXXXXX.ts)"
  trap 'rm -f "$TMP_FILE"' EXIT

  if ! npx openapi-typescript ./openapi/openapi.yaml -o "$TMP_FILE" 2>/dev/null; then
    echo "[ERROR] openapi-typescript 실행 실패"
    exit 1
  fi

  SCHEMA_FILE="$PROJECT_ROOT/src/lib/api/schema.ts"
  if [[ ! -f "$SCHEMA_FILE" ]]; then
    echo "[ERROR] schema.ts 없음. 먼저 ./scripts/gen-api.sh 실행 필요"
    exit 1
  fi

  if ! diff -q "$SCHEMA_FILE" "$TMP_FILE" > /dev/null 2>&1; then
    echo ""
    echo "[ERROR] OpenAPI drift detected!"
    echo "  schema.ts가 최신 openapi.yaml과 다릅니다."
    echo "  재생성 방법: ./scripts/gen-api.sh"
    exit 1
  fi

  echo "[gen-api] 3/3 drift 없음 — schema.ts 최신 상태"
  exit 0
fi

# 3. 타입 생성
echo "[gen-api] 2/3 TypeScript 타입 생성 중..."
if ! npm run gen:api 2>&1; then
  echo "[ERROR] gen:api 실패. openapi.yaml 문법을 확인하세요."
  exit 1
fi

SCHEMA_FILE="$PROJECT_ROOT/src/lib/api/schema.ts"
if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "[ERROR] schema.ts 생성 실패 — 파일이 존재하지 않습니다"
  exit 1
fi

LINE_COUNT=$(wc -l < "$SCHEMA_FILE" | tr -d ' ')
if [[ "$LINE_COUNT" -lt 100 ]]; then
  echo "[ERROR] schema.ts 줄 수 부족: ${LINE_COUNT}줄 (최소 100줄 필요)"
  exit 1
fi

echo "[gen-api] 3/3 완료"
echo "  schema.ts: ${LINE_COUNT}줄"
echo ""
echo "다음 단계: npm run typecheck"
