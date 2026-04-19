"use client";

import { useRouter } from "next/navigation";
import { User, LogOut, ChevronRight, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

export default function MyPage() {
  const { user, memberships, logout } = useAuth();
  const router = useRouter();

  const hasOperatorRole = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles)
    .includes("OPERATOR");

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 rounded-xl bg-surface p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
          <User className="h-7 w-7 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-foreground truncate">
            {user?.displayName ?? user?.email ?? "사용자"}
          </p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
        </div>
      </div>

      {hasOperatorRole && (
        <div className="mt-4">
          <button
            onClick={() => router.push("/operator")}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 min-h-[44px] hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">운영자 모드로 전환</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5 opacity-50">
          <span className="text-sm text-foreground">알림 설정</span>
          <span className="text-xs text-muted">준비 중</span>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-white px-4 py-3.5 min-h-[44px] text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-semibold">로그아웃</span>
        </button>
      </div>
    </div>
  );
}
