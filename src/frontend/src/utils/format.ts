/**
 * Format bigint cents into dollar display string
 * e.g. 1250n → "$12.50"
 */
export function formatMoney(cents: bigint | number): string {
  const num = typeof cents === "bigint" ? Number(cents) : cents;
  return `$${(num / 100).toFixed(2)}`;
}

/**
 * Convert dollar string to cents bigint
 * e.g. "12.50" → 1250n
 */
export function dollarsToCents(dollars: string): bigint {
  const n = Number.parseFloat(dollars);
  if (Number.isNaN(n) || n < 0) return BigInt(0);
  return BigInt(Math.round(n * 100));
}

/**
 * Format a nanosecond timestamp (Time = bigint) to a readable date/time
 */
export function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a nanosecond timestamp to time string
 */
export function formatTime(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  const d = new Date(ms);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Check if a nanosecond timestamp is today
 */
export function isToday(ns: bigint): boolean {
  const ms = Number(ns / BigInt(1_000_000));
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a nanosecond timestamp is this week (Mon-Sun)
 */
export function isThisWeek(ns: bigint): boolean {
  const ms = Number(ns / BigInt(1_000_000));
  const d = new Date(ms);
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  startOfWeek.setDate(now.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}
