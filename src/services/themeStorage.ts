import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "sensoraya.theme-mode";
const ACCENT_COLOR_KEY = "sensoraya.accent-color";

export type ThemeMode = "system" | "light" | "dark";
export type AccentColorId =
  | "system"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "orange"
  | "red"
  | "rose"
  | "amber"
  | "slate";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function isAccentColorId(value: string | null): value is AccentColorId {
  return (
    value === "system" ||
    value === "violet" ||
    value === "indigo" ||
    value === "blue" ||
    value === "cyan" ||
    value === "teal" ||
    value === "green" ||
    value === "orange" ||
    value === "red" ||
    value === "rose" ||
    value === "amber" ||
    value === "slate"
  );
}

async function readValue(key: string): Promise<string | null> {
  return Platform.OS === "web"
    ? (globalThis.localStorage?.getItem(key) ?? null)
    : SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export const themeStorage = {
  async getThemeMode(): Promise<ThemeMode> {
    const saved = await readValue(THEME_KEY);
    return isThemeMode(saved) ? saved : "system";
  },

  async setThemeMode(mode: ThemeMode): Promise<void> {
    await writeValue(THEME_KEY, mode);
  },

  async getAccentColor(): Promise<AccentColorId> {
    const saved = await readValue(ACCENT_COLOR_KEY);
    return isAccentColorId(saved) ? saved : "system";
  },

  async setAccentColor(color: AccentColorId): Promise<void> {
    await writeValue(ACCENT_COLOR_KEY, color);
  }
};
