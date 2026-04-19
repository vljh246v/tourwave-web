/**
 * middleware.ts — Next.js 라우트 가드 (Edge Runtime)
 *
 * 보호 계층:
 *   1. 비인증 → /login?returnTo=<path> 리다이렉트
 *   2. /operator/* → 운영자 권한 (INSTRUCTOR, ORG_MEMBER, ORG_ADMIN, ORG_OWNER)
 *   3. /admin/*    → 관리자 권한 (ORG_ADMIN, ORG_OWNER)
 *
 * 쿠키: access_token (httpOnly, path=/)
 * Edge Runtime 제약: atob() 사용 (Buffer.from 불가)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyOperatorRole, verifyAdminRole } from '@/lib/auth/roleGuard'

/** 인증 없이 접근 가능한 경로 (완전 일치) */
const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/auth/refresh'])

/** 공개 경로 접두사 (하위 포함) */
const PUBLIC_PREFIXES = ['/tours']

const OPERATOR_PREFIX = '/operator'
const ADMIN_PREFIX = '/admin'

/** 보호 라우트 접두사 (인증만 필요, 역할 무관) */
const AUTH_REQUIRED_PREFIXES = ['/bookings', '/profile', '/favorites']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value ?? null

  // 1. 완전 공개 경로
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // 2. 공개 접두사 경로 (/tours/*)
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // 3. 비인증 → /login 리다이렉트
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 4. /admin/* — 관리자 권한 검증 (ORG_ADMIN, ORG_OWNER)
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!verifyAdminRole(token)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // 5. /operator/* — 운영자 권한 검증 (INSTRUCTOR, ORG_MEMBER, ORG_ADMIN, ORG_OWNER)
  if (pathname.startsWith(OPERATOR_PREFIX)) {
    if (!verifyOperatorRole(token)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // 6. 인증 필요 라우트 (/bookings, /profile, /favorites) — 토큰 보유 자체로 충분
  if (AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 미들웨어 적용:
     * - _next/static (정적 에셋)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - api/ (API 라우트)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
