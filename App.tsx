import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationBar as SystemNavigationBar } from "expo-navigation-bar";

import {
  AuthViewModelProvider,
  useAuthViewModel
} from "./src/viewmodels/AuthViewModel";
import { SettingsViewModelProvider } from "./src/viewmodels/SettingsViewModel";
import { AlarmViewModelProvider } from "./src/viewmodels/AlarmViewModel";
import { predictiveBack } from "./src/services/predictiveBack.android";
import { AppShell } from "./src/views/AppShell.android";
import { LoadingScreen } from "./src/views/LoadingScreen.android";
import { LoginScreen } from "./src/views/LoginScreen.android";

function AppContent() {
  const { status, error, retryRestore, signOut } = useAuthViewModel();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (status === "signedIn" || !predictiveBack.setPredictiveBackEnabled) {
      return;
    }
    void predictiveBack.setPredictiveBackEnabled(false).catch(() => {
      // Android's regular Activity back behavior remains the fallback.
    });
  }, [status]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#141218" : "#FFFBFE" }}
      edges={["top", "bottom"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} animated />
      <SystemNavigationBar style={isDark ? "dark" : "light"} />
      {status === "restoring" ? (
        <LoadingScreen />
      ) : status === "restoreFailed" ? (
        <LoadingScreen
          error={error}
          onRetry={() => void retryRestore()}
          onUseAnotherToken={() => void signOut()}
        />
      ) : status === "signedIn" ? (
        <AlarmViewModelProvider>
          <AppShell />
        </AlarmViewModelProvider>
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsViewModelProvider>
        <AuthViewModelProvider>
          <AppContent />
        </AuthViewModelProvider>
      </SettingsViewModelProvider>
    </SafeAreaProvider>
  );
}
