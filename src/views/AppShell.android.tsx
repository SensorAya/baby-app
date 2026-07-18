import { useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import {
  Host,
  NavigationBar,
  NavigationBarItem,
  Text
} from "@expo/ui/jetpack-compose";

import { BRAND_SEED } from "../ui/theme";
import { HistoryScreen } from "./HistoryScreen.android";
import { ReportScreen } from "./ReportScreen.android";

type Tab = "history" | "report";

export function AppShell() {
  const colorScheme = useColorScheme();
  const [tab, setTab] = useState<Tab>("history");

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === "history" ? <HistoryScreen /> : <ReportScreen />}
      </View>
      <Host matchContents seedColor={BRAND_SEED} colorScheme={colorScheme}>
        <NavigationBar tonalElevation={3}>
          <NavigationBarItem selected={tab === "history"} onClick={() => setTab("history")}>
            <NavigationBarItem.Label>
              <Text>监测记录</Text>
            </NavigationBarItem.Label>
          </NavigationBarItem>
          <NavigationBarItem selected={tab === "report"} onClick={() => setTab("report")}>
            <NavigationBarItem.Label>
              <Text>智能报告</Text>
            </NavigationBarItem.Label>
          </NavigationBarItem>
        </NavigationBar>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 }
});
