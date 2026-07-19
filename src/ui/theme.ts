export const BRAND_SEED = "#6750A4";

const recordClockFormatter = new Intl.DateTimeFormat("zh-TW", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const recordDayFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short"
});

const recordDayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function formatRecordTime(timestamp: number): string {
  return recordClockFormatter.format(new Date(timestamp * 1000));
}

export function formatRecordDay(timestamp: number): string {
  return recordDayFormatter.format(new Date(timestamp * 1000));
}

export function getRecordDayKey(timestamp: number): string {
  return recordDayKeyFormatter.format(new Date(timestamp * 1000));
}

export function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}
