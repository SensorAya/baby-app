import type { ExpoConfig, ConfigContext } from "expo/config";

function normalizeApiUrl(value: string | undefined): string {
  const raw = value?.trim() || "http://10.0.2.2:8000";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/$/, "");
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SensorAya Baby",
  slug: "sensoraya-baby",
  scheme: "sensoraya-baby",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  android: {
    package: "com.sensoraya.baby",
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon.png",
      backgroundColor: "#6750A4"
    }
  },
  extra: {
    apiUrl: normalizeApiUrl(process.env.URL)
  },
  plugins: [
    "expo-secure-store",
    ["expo-navigation-bar", { enforceContrast: false }],
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true
        }
      }
    ]
  ]
});
