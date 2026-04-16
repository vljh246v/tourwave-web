#!/usr/bin/env bash
# =============================================================================
# sync-openapi.sh — 백엔드 docs/openapi.yaml을 프론트로 복사
# 사용법: ./scripts/sync-openapi.sh [백엔드 repo 경로]
#
# 기본 경로: ../tourwave (workspace 옆)
# 환경변수 TOURWAVE_BACKEND_PATH 로 덮어쓸 수 있음
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_BACKEND="$(cd "$PROJECT_ROOT/.." && pwd)/tourwave"
BACKEND_PATH="${1:-${TOURWAVE_BACKEND_PATH:-$DEFAULT_BACKEND}}"

SRC_FILE="$BACKEND_PATH/docs/openapi.yaml"
DST_FILE="$PROJECT_ROOT/openapi/openapi.yaml"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "[ERROR] 백엔드 OpenAPI 스펙을 찾을 수 없습니다: $SRC_FILE"
  echo "  사용법: $0 [백엔드 repo 경로]"
  echo "  또는 TOURWAVE_BACKEND_PATH 환경변수 설정"
  exit 1
fi

mkdir -p "$(dirname "$DST_FILE")"

if [[ -f "$DST_FILE" ]] && cmp -s "$SRC_FILE" "$DST_FILE"; then
  echo "[OK] OpenAPI 스펙 변경 없음 ($DST_FILE)"
  exit 0
fi

cp "$SRC_FILE" "$DST_FILE"
echo "[OK] OpenAPI 스펙 복사됨: $SRC_FILE → $DST_FILE"
echo ""
echo "다음 단계: 타입 재생성"
echo "  npm run gen:api"
