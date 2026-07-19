import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { Appearance } from "react-native";

import {
  themeStorage,
  type AccentColorId,
  type ThemeMode
} from "../services/themeStorage";
import { getAccentSeed } from "../ui/theme";

type SettingsViewModel = {
  themeMode: ThemeMode;
  accentColor: AccentColorId;
  accentSeed: string | undefined;
  error: string | null;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setAccentColor: (color: AccentColorId) => Promise<void>;
  clearError: () => void;
};

const SettingsContext = createContext<SettingsViewModel | null>(null);

function applyTheme(mode: ThemeMode): void {
  Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
}

export function SettingsViewModelProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [accentColor, setAccentColorState] =
    useState<AccentColorId>("system");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      themeStorage.getThemeMode(),
      themeStorage.getAccentColor()
    ])
      .then(([savedMode, savedAccentColor]) => {
        if (!active) return;
        setThemeModeState(savedMode);
        setAccentColorState(savedAccentColor);
        applyTheme(savedMode);
      })
      .catch(() => {
        if (active) setError("无法读取已保存的外观设置");
      });

    return () => {
      active = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setError(null);
    setThemeModeState(mode);
    applyTheme(mode);
    try {
      await themeStorage.setThemeMode(mode);
    } catch {
      setError("外观已临时切换，但无法保存到本设备");
    }
  }, []);

  const setAccentColor = useCallback(async (color: AccentColorId) => {
    setError(null);
    setAccentColorState(color);
    try {
      await themeStorage.setAccentColor(color);
    } catch {
      setError("强调色已临时切换，但无法保存到本设备");
    }
  }, []);

  const value = useMemo<SettingsViewModel>(
    () => ({
      themeMode,
      accentColor,
      accentSeed: getAccentSeed(accentColor),
      error,
      setThemeMode,
      setAccentColor,
      clearError: () => setError(null)
    }),
    [accentColor, error, setAccentColor, setThemeMode, themeMode]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsViewModel(): SettingsViewModel {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsViewModel must be used inside SettingsViewModelProvider"
    );
  }
  return context;
}
