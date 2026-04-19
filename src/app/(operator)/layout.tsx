import Link from "next/link";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Settings,
} from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";

const NAV_ITEMS = [
  { href: "/operator",           label: "대시보드", Icon: LayoutDashboard },
  { href: "/operator/tours",     label: "투어 관리", Icon: Map            },
  { href: "/operator/bookings",  label: "예약 관리", Icon: CalendarCheck  },
  { href: "/operator/settings",  label: "설정",     Icon: Settings        },
] as const;

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav mode="operator" />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="운영자 사이드 메뉴">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-primary-dark"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 overflow-hidden px-4 py-4 lg:px-0 lg:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
