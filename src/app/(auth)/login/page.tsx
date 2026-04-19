import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginFormWithRedirect } from "@/features/auth/LoginFormWithRedirect";

export const metadata: Metadata = { title: "로그인 — Tourwave" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">
        로그인
      </h1>
      <Suspense>
        <LoginFormWithRedirect />
      </Suspense>
    </>
  );
}
