/**
 * roleGuard.ts — Edge Runtime 호환 역할 검증 유틸
 *
 * - Edge Runtime 제약: Buffer.from 사용 불가 → atob() 사용
 * - 서명 검증은 백엔드 담당; 여기서는 페이로드 디코딩만 수행
 * - 쿠키명: access_token (path=/)
 */

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Base64url → Base64 변환 후 디코딩
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * 운영자 권한 보유 여부 확인
 * INSTRUCTOR, ORG_MEMBER, ORG_ADMIN, ORG_OWNER 중 하나 이상 포함 시 true
 */
export function verifyOperatorRole(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload) return false
  const roles = payload.roles as string[] | undefined
  return (
    Array.isArray(roles) &&
    roles.some((r) =>
      ['INSTRUCTOR', 'ORG_MEMBER', 'ORG_ADMIN', 'ORG_OWNER'].includes(r)
    )
  )
}

/**
 * 관리자 권한 보유 여부 확인
 * ORG_ADMIN, ORG_OWNER 중 하나 이상 포함 시 true
 */
export function verifyAdminRole(token: string): boolean {
  const payload = parseJwtPayload(token)
  if (!payload) return false
  const roles = payload.roles as string[] | undefined
  return (
    Array.isArray(roles) &&
    roles.some((r) => ['ORG_ADMIN', 'ORG_OWNER'].includes(r))
  )
}
