export function parseMntAmount(value: string | number): number {
  if (typeof value === "number") return value;
  return Number(value.replace(/[^0-9.-]/g, ""));
}

export function formatMntPrice(value: string | number): string {
  const amount = parseMntAmount(value);
  if (!Number.isFinite(amount)) return "Price unavailable";

  return `${new Intl.NumberFormat("mn-MN", {
    maximumFractionDigits: 0,
  }).format(amount)} ₮`;
}
