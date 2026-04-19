import Link from "next/link";
import { RoleSwitcher } from "./RoleSwitcher";

interface Props {
  mode: "customer" | "operator";
}

export function TopNav({ mode }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white px-4 pt-safe">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between">
        <Link
          href={mode === "customer" ? "/" : "/operator"}
          className="font-display text-xl font-extrabold tracking-tight text-primary"
        >
          TOURWAVE
        </Link>
        <RoleSwitcher mode={mode} />
      </div>
    </header>
  );
}
