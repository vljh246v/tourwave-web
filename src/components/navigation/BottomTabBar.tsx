"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User } from "lucide-react";

const TABS = [
  { href: "/",         label: "홈",   Icon: Home          },
  { href: "/explore",  label: "탐색", Icon: Search        },
  { href: "/bookings", label: "예약", Icon: ClipboardList  },
  { href: "/my",       label: "마이", Icon: User          },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 탭 메뉴"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white pb-safe"
    >
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 min-h-[56px] flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={20}
                className={active ? "text-primary-dark" : "text-muted"}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] ${
                  active
                    ? "font-semibold text-primary-dark"
                    : "text-muted"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
