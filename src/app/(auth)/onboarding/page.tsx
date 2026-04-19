"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

const OPERATOR_ROLES = ["INSTRUCTOR", "ORG_MEMBER", "ORG_ADMIN", "ORG_OWNER"];

export default function OnboardingPage() {
  const router = useRouter();
  const { memberships } = useAuth();

  const isOperator = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles)
    .some((r) => OPERATOR_ROLES.includes(r));

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          환영합니다! 👋
        </h1>
        <p className="mt-1 text-sm text-muted">어떤 용도로 사용하시나요?</p>
      </div>

      <button
        onClick={() => router.push("/")}
        className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-primary bg-surface px-4 py-5 text-center transition hover:bg-primary/5"
      >
        <span className="text-3xl" role="img" aria-label="서핑">🏄</span>
        <span className="font-display text-base font-bold text-primary-dark">
          액티비티 즐기기
        </span>
        <span className="text-xs text-muted">투어 탐색 · 예약 · 관리</span>
      </button>

      {isOperator && (
        <button
          onClick={() => router.push("/operator")}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-5 text-center transition hover:bg-surface"
        >
          <span className="text-3xl" role="img" aria-label="오피스">🏢</span>
          <span className="font-display text-base font-bold text-foreground">
            투어 운영하기
          </span>
          <span className="text-xs text-muted">투어 등록 · 예약 관리 · 정산</span>
        </button>
      )}

      <p className="text-center text-xs text-muted">
        나중에 언제든 전환 가능해요
      </p>
    </div>
  );
}
