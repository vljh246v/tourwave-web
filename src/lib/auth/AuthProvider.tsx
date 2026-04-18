"use client";

/**
 * AuthProvider.tsx — 인증 Context + Provider
 *
 * - httpOnly cookie 전략: 모든 auth fetch에 credentials: 'include'
 * - 마운트 시 /me 호출로 이전 세션 복원
 * - 401 응답 시 /auth/refresh 자동 호출 → 실패 시 로그아웃
 * - 동시 401 race condition 방지: 단일 비행 refresh (inflightRefresh)
 */

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { components } from "../api/schema";
import { setUnauthorizedHandler } from "../api/client";

// ─── 타입 ────────────────────────────────────────────────────────────────────

type User = components["schemas"]["User"];
type Membership = components["schemas"]["Membership"];
type LoginRequest = components["schemas"]["LoginRequest"];
type SignupRequest = components["schemas"]["SignupRequest"];

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  /** 첫 번째 ACTIVE 멤버십 편의 값 (없으면 null) */
  org: Membership | null;
  memberships: Membership[];
  loading: boolean;
  error: string | null;
  login(credentials: LoginRequest): Promise<void>;
  signup(data: SignupRequest): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

// ─── 내부 fetch 헬퍼 (credentials: 'include') ────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: { code: "UNKNOWN", message: res.statusText } }));
    const code: string = (body as { error?: { code?: string } }).error?.code ?? "UNKNOWN";
    const msg: string = (body as { error?: { message?: string } }).error?.message ?? res.statusText;
    const err = new Error(msg) as Error & { status: number; code: string };
    err.status = res.status;
    err.code = code;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── 단일 비행 refresh 상태 (모듈 레벨) ─────────────────────────────────────

let inflightRefresh: Promise<void> | null = null;

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 마운트 여부 추적 (언마운트 후 상태 업데이트 방지)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearSession = useCallback(() => {
    if (!mountedRef.current) return;
    setUser(null);
    setMemberships([]);
    setError(null);
  }, []);

  // ── /me 세션 복원 ──────────────────────────────────────────────────────────

  const fetchMe = useCallback(async (): Promise<boolean> => {
    try {
      const data = await authFetch<{
        user: User;
        memberships: Membership[];
      }>("/me");
      if (mountedRef.current) {
        setUser(data.user);
        setMemberships(data.memberships);
        setError(null);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── refreshToken ───────────────────────────────────────────────────────────

  const refreshToken = useCallback(async (): Promise<void> => {
    // 이미 진행 중인 refresh가 있으면 동일한 Promise를 반환 (단일 비행)
    if (inflightRefresh !== null) {
      return inflightRefresh;
    }

    inflightRefresh = (async () => {
      try {
        // httpOnly cookie 전략: refreshToken은 쿠키로 전송.
        // RefreshRequest body는 비워서 전송 (서버가 쿠키에서 읽음).
        await authFetch<unknown>("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({}),
        });
        await fetchMe();
      } catch {
        clearSession();
        throw new Error("SESSION_EXPIRED");
      } finally {
        inflightRefresh = null;
      }
    })();

    return inflightRefresh;
  }, [fetchMe, clearSession]);

  // apiClient 401 → refresh → 실패 시 logout 트리거
  useEffect(() => {
    setUnauthorizedHandler(refreshToken);
    return () => setUnauthorizedHandler(null);
  }, [refreshToken]);

  // ── 마운트 시 세션 복원 ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      setLoading(true);
      const ok = await fetchMe();
      if (!ok) {
        // 자동 refresh 시도
        try {
          await refreshToken();
        } catch {
          // refresh 실패 = 미인증 상태, 에러는 표시하지 않음
          if (mountedRef.current && !cancelled) {
            clearSession();
          }
        }
      }
      if (mountedRef.current && !cancelled) {
        setLoading(false);
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginRequest): Promise<void> => {
      setError(null);
      try {
        await authFetch<unknown>("/auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        // 로그인 성공 후 /me로 사용자 정보 로드
        const ok = await fetchMe();
        if (!ok) {
          throw new Error("FETCH_ME_FAILED");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "LOGIN_FAILED";
        if (mountedRef.current) setError(msg);
        throw e;
      }
    },
    [fetchMe],
  );

  // ── signup ─────────────────────────────────────────────────────────────────

  const signup = useCallback(
    async (data: SignupRequest): Promise<void> => {
      setError(null);
      try {
        await authFetch<unknown>("/auth/signup", {
          method: "POST",
          body: JSON.stringify(data),
        });
        // 회원가입 성공 후 /me로 사용자 정보 로드
        const ok = await fetchMe();
        if (!ok) {
          throw new Error("FETCH_ME_FAILED");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "SIGNUP_FAILED";
        if (mountedRef.current) setError(msg);
        throw e;
      }
    },
    [fetchMe],
  );

  // ── logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authFetch<unknown>("/auth/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // ── 파생값 ────────────────────────────────────────────────────────────────

  const org = memberships.find((m) => m.status === "ACTIVE") ?? null;
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        org,
        memberships,
        loading,
        error,
        login,
        signup,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
