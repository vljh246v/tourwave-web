export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(amount);
}
