export const BRAND_SEED = "#6750A4";

export function formatRecordTime(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(timestamp * 1000));
}

export function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}
