"use client";

/**
 * useAuth.ts — 인증 훅
 *
 * AuthContext를 소비하는 훅과 역할 기반 가드 훅을 제공한다.
 */

import { useContext } from "react";
import { AuthContext, type AuthContextType } from "./AuthProvider";

export type { AuthContextType };

/**
 * 인증 컨텍스트를 반환하는 훅.
 * AuthProvider 외부에서 사용하면 에러를 던진다.
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/**
 * 역할 기반 접근 제어 훅.
 * @param requiredRoles 필요한 역할 목록. 하나라도 보유하면 허용.
 * @returns { allowed: boolean, loading: boolean }
 */
export function useAuthGuard(requiredRoles: string[]): {
  allowed: boolean;
  loading: boolean;
} {
  const { isAuthenticated, memberships, loading } = useAuth();

  if (loading) {
    return { allowed: false, loading: true };
  }

  if (!isAuthenticated) {
    return { allowed: false, loading: false };
  }

  if (requiredRoles.length === 0) {
    return { allowed: true, loading: false };
  }

  const userRoles = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles);

  const allowed = requiredRoles.some((r) => userRoles.includes(r));
  return { allowed, loading: false };
}
