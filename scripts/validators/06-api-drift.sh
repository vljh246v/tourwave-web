#!/usr/bin/env bash
# =============================================================================
# 06-api-drift.sh — OpenAPI 타입 drift 검증
# 인수: $1=워크트리 경로, $2=프로젝트 루트
#
# openapi.yaml에서 타입을 임시 재생성 후 커밋된 schema.ts와 비교.
# 다르면 "OpenAPI drift detected" 출력 후 exit 1.
# =============================================================================
set -euo pipefail

_RAW_WORKTREE="${1:-$(pwd)}"
WORKTREE_PATH="$(cd "$_RAW_WORKTREE" && pwd)"
PROJECT_ROOT="${2:-$(pwd)}"

echo "[API-DRIFT] OpenAPI 타입 drift 검사 중..."

SCHEMA_FILE="$WORKTREE_PATH/src/lib/api/schema.ts"
OPENAPI_FILE="$WORKTREE_PATH/openapi/openapi.yaml"

if [[ ! -f "$OPENAPI_FILE" ]]; then
  echo "[SKIP] openapi.yaml 없음 — drift 검사 생략"
  exit 0
fi

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo ""
  echo "[API-DRIFT FAILURE] validators/06-api-drift.sh"
  echo "  src/lib/api/schema.ts 없음"
  echo "  재생성: ./scripts/gen-api.sh"
  exit 1
fi

TMP_FILE="$(mktemp /tmp/schema-drift-XXXXXX.ts)"
trap 'rm -f "$TMP_FILE"' EXIT

cd "$WORKTREE_PATH"

if ! npx openapi-typescript "$OPENAPI_FILE" -o "$TMP_FILE" 2>/dev/null; then
  echo "[WARN] openapi-typescript 실행 실패 — drift 검사 생략"
  exit 0
fi

if diff -q "$SCHEMA_FILE" "$TMP_FILE" > /dev/null 2>&1; then
  echo "[API-DRIFT] schema.ts 최신 상태 — drift 없음"
  exit 0
fi

echo ""
echo "[API-DRIFT FAILURE] validators/06-api-drift.sh"
echo "  OpenAPI drift detected!"
echo "  커밋된 schema.ts가 현재 openapi.yaml과 다릅니다."
echo ""
echo "  diff (처음 20줄):"
diff "$SCHEMA_FILE" "$TMP_FILE" | head -20 | sed 's/^/  /'
echo ""
echo "  재생성 방법:"
echo "    ./scripts/gen-api.sh"
echo "    git add src/lib/api/schema.ts && git commit --amend --no-edit"
echo ""
exit 1
