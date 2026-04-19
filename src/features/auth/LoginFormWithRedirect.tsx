"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";

export function LoginFormWithRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";

  return <LoginForm onSuccess={() => router.replace(returnTo)} />;
}
