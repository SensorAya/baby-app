import { useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import {
  Host,
  Icon,
  NavigationBar,
  NavigationBarItem,
  Text
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, size } from "@expo/ui/jetpack-compose/modifiers";

import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useAlarmViewModel } from "../viewmodels/AlarmViewModel";
import { AlarmBanner } from "./AlarmBanner.android";
import { HistoryScreen } from "./HistoryScreen.android";
import { ReportScreen } from "./ReportScreen.android";
import { SettingsScreen } from "./SettingsScreen.android";

type Tab = "history" | "report";

export function AppShell() {
  const colorScheme = useColorScheme();
  const [tab, setTab] = useState<Tab>("history");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { accentSeed } = useSettingsViewModel();
  const alarmViewModel = useAlarmViewModel();

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View
          style={[
            styles.screen,
            (tab !== "history" || settingsOpen) && styles.hidden
          ]}
        >
          <HistoryScreen onOpenSettings={() => setSettingsOpen(true)} />
        </View>
        <View
          style={[
            styles.screen,
            (tab !== "report" || settingsOpen) && styles.hidden
          ]}
        >
          <ReportScreen />
        </View>
        <View style={[styles.screen, !settingsOpen && styles.hidden]}>
          <SettingsScreen onBack={() => setSettingsOpen(false)} />
        </View>
      </View>
      {alarmViewModel.active && !alarmViewModel.dismissed && alarmViewModel.alarm ? (
        <AlarmBanner alarm={alarmViewModel.alarm} onDismiss={alarmViewModel.dismiss} />
      ) : null}
      {settingsOpen ? null : (
        <Host
          matchContents={{ vertical: true }}
          style={styles.navigationHost}
          seedColor={accentSeed}
          colorScheme={colorScheme}
        >
          <NavigationBar tonalElevation={3} modifiers={[fillMaxWidth()]}>
            <NavigationBarItem
              selected={tab === "history"}
              onClick={() => setTab("history")}
            >
              <NavigationBarItem.Icon>
                <Icon
                  source={require("../assets/history.xml")}
                  size={24}
                  modifiers={[size(24, 24)]}
                  contentDescription="监测记录"
                />
              </NavigationBarItem.Icon>
              <NavigationBarItem.Label>
                <Text>监测记录</Text>
              </NavigationBarItem.Label>
            </NavigationBarItem>
            <NavigationBarItem
              selected={tab === "report"}
              onClick={() => setTab("report")}
            >
              <NavigationBarItem.Icon>
                <Icon
                  source={require("../assets/insights.xml")}
                  size={24}
                  modifiers={[size(24, 24)]}
                  contentDescription="智能报告"
                />
              </NavigationBarItem.Icon>
              <NavigationBarItem.Label>
                <Text>智能报告</Text>
              </NavigationBarItem.Label>
            </NavigationBarItem>
          </NavigationBar>
        </Host>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  navigationHost: { width: "100%" },
  screen: { flex: 1 },
  hidden: { display: "none" }
});
