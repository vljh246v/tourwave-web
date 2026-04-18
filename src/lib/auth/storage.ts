/**
 * storage.ts — 토큰 저장소 추상화
 *
 * T-912 전략: httpOnly cookie (서버가 소유).
 * 클라이언트는 토큰을 직접 읽거나 쓰지 않는다.
 * credentials: 'include'로 모든 auth fetch를 보낸다.
 * 이 인터페이스는 나중에 Bearer/memory 전략으로 교체 가능하도록 유지한다.
 */

export interface TokenStorage {
  /**
   * 저장된 토큰이 있는지 여부를 반환한다.
   * httpOnly cookie 전략에서는 항상 true를 반환한다
   * (실제 유효성은 서버가 /me 호출로 판별).
   */
  hasToken(): boolean;

  /**
   * 로컬 상태에서 토큰을 제거한다.
   * httpOnly cookie 전략에서는 no-op (서버가 /auth/logout으로 쿠키를 삭제).
   */
  clearToken(): void;
}

/**
 * httpOnly cookie 전략 구현체.
 * 쿠키는 서버가 Set-Cookie로 관리하며, 클라이언트는 credentials: 'include'로만 전송한다.
 */
export class CookieTokenStorage implements TokenStorage {
  hasToken(): boolean {
    // httpOnly cookie는 JS에서 읽을 수 없다.
    // 세션 유효 여부는 /me 호출 결과로 판단한다.
    return true;
  }

  clearToken(): void {
    // no-op: 서버의 /auth/logout 엔드포인트가 쿠키를 만료시킨다.
  }
}

export const defaultStorage: TokenStorage = new CookieTokenStorage();
