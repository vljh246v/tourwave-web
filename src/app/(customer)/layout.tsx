import { TopNav } from "@/components/navigation/TopNav";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { ClientAuthGuard } from "@/lib/auth/ClientAuthGuard";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthGuard>
      <div className="flex min-h-dvh flex-col bg-white">
        <TopNav mode="customer" />
        <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </ClientAuthGuard>
  );
}
