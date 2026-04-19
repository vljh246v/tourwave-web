export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-col items-center bg-gradient-to-br from-primary to-primary-dark px-6 pb-10 pt-16">
        <span className="font-display text-3xl font-extrabold tracking-tight text-white">
          TOURWAVE
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">
          액티비티 예약 플랫폼
        </span>
      </div>

      <div className="-mt-4 flex flex-1 flex-col rounded-t-2xl bg-white px-6 pb-8 pt-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
