"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

const OPERATOR_ROLES = ["INSTRUCTOR", "ORG_MEMBER", "ORG_ADMIN", "ORG_OWNER"];

interface Props {
  mode: "customer" | "operator";
}

export function RoleSwitcher({ mode }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, memberships, logout } = useAuth();

  const isOperator = memberships
    .filter((m) => m.status === "ACTIVE")
    .flatMap((m) => m.roles)
    .some((r) => OPERATOR_ROLES.includes(r));

  const initials = user?.displayName?.[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleSwitch() {
    setOpen(false);
    router.push(mode === "customer" ? "/operator" : "/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="계정 메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-8 items-center justify-center rounded-full bg-primary-dark text-sm font-bold text-white"
      >
        {initials}
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-green-500" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-white p-2 shadow-md"
        >
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {mode === "customer" ? "고객 모드" : "운영자 모드"}
          </p>

          {isOperator && (
            <button
              role="menuitem"
              onClick={handleSwitch}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-surface"
            >
              <ArrowLeftRight size={14} className="text-primary" />
              {mode === "customer" ? "운영자 모드로 전환" : "고객 모드로 전환"}
            </button>
          )}

          <hr className="my-1.5 border-border" />

          <button
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-red-50"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
