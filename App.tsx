import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import {
  AuthViewModelProvider,
  useAuthViewModel
} from "./src/viewmodels/AuthViewModel";
import { AppShell } from "./src/views/AppShell.android";
import { LoadingScreen } from "./src/views/LoadingScreen.android";
import { LoginScreen } from "./src/views/LoginScreen.android";

function AppContent() {
  const { status } = useAuthViewModel();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <StatusBar style="auto" />
      {status === "restoring" ? (
        <LoadingScreen />
      ) : status === "signedIn" ? (
        <AppShell />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthViewModelProvider>
        <AppContent />
      </AuthViewModelProvider>
    </SafeAreaProvider>
  );
}
