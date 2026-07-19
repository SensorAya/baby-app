import type { AccentColorId } from "../services/themeStorage";

export const ACCENT_COLORS: ReadonlyArray<{
  id: AccentColorId;
  label: string;
  seed?: string;
}> = [
  { id: "system", label: "系统" },
  { id: "red", label: "朱红", seed: "#B3261E" },
  { id: "rose", label: "玫红", seed: "#984061" },
  { id: "violet", label: "紫罗兰", seed: "#6750A4" },
  { id: "indigo", label: "靛蓝", seed: "#3F51B5" },
  { id: "blue", label: "海蓝", seed: "#0061A4" },
  { id: "cyan", label: "青蓝", seed: "#006875" },
  { id: "teal", label: "青绿", seed: "#006A60" },
  { id: "green", label: "翠绿", seed: "#386A20" },
  { id: "amber", label: "琥珀", seed: "#825500" },
  { id: "orange", label: "橙色", seed: "#8B5000" },
  { id: "slate", label: "岩灰", seed: "#545F71" }
] as const;

export function getAccentSeed(id: AccentColorId): string | undefined {
  return ACCENT_COLORS.find((option) => option.id === id)?.seed;
}

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
