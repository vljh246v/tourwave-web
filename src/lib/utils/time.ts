export function formatInTimezone(
  utcString: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: timezone, ...options }).format(
    new Date(utcString)
  );
}

export function dateRangeFromNow(daysAhead: number): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + daysAhead);
  return { dateFrom: now.toISOString(), dateTo: future.toISOString() };
}
