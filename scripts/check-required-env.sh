#!/usr/bin/env bash
# =============================================================================
# check-required-env.sh — Tourwave Web 환경 변수 검증
# 사용법: ./scripts/check-required-env.sh <local|preview|production>
# =============================================================================

set -euo pipefail

profile="${1:-}"

if [[ -z "$profile" ]]; then
  echo "[ERROR][E_USAGE] Usage: $0 <local|preview|production>"
  exit 2
fi

required_keys=()
case "$profile" in
  local)
    required_keys=(
      NEXT_PUBLIC_API_BASE_URL
    )
    ;;
  preview)
    required_keys=(
      NEXT_PUBLIC_API_BASE_URL
      NEXT_PUBLIC_ENVIRONMENT
    )
    ;;
  production)
    required_keys=(
      NEXT_PUBLIC_API_BASE_URL
      NEXT_PUBLIC_ENVIRONMENT
    )
    ;;
  *)
    echo "[ERROR][E_UNSUPPORTED_PROFILE] Unsupported profile '$profile'. Expected one of: local, preview, production"
    exit 2
    ;;
esac

missing_keys=()
for key in "${required_keys[@]}"; do
  value="${!key:-}"
  if [[ -z "${value//[[:space:]]/}" ]]; then
    missing_keys+=("$key")
  fi
done

if (( ${#missing_keys[@]} > 0 )); then
  echo "[ERROR][E_MISSING_REQUIRED_ENV] Missing required environment variables for profile '$profile': ${missing_keys[*]}"
  exit 1
fi

echo "[OK] All required environment variable keys are present for profile '$profile'."
