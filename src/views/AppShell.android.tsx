import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  StyleSheet,
  useColorScheme,
  View
} from "react-native";
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
import type {
  MonitoringSessionSummary,
  ReportQuery,
  SavedMonitoringReport
} from "../models/types";
import {
  createSessionReportQuery,
  getReportCacheKey
} from "../services/reportStorage";
import {
  predictiveBack,
  type PredictiveBackEvent
} from "../services/predictiveBack.android";
import { AlarmBanner } from "./AlarmBanner.android";
import { HistoryScreen } from "./HistoryScreen.android";
import { ReportDetailScreen } from "./ReportDetailScreen.android";
import { ReportScreen } from "./ReportScreen.android";
import { SettingsScreen } from "./SettingsScreen.android";

type Tab = "history" | "report";
type ReportDestination = {
  query: ReportQuery;
  initialReport?: SavedMonitoringReport;
  sessionSummary?: MonitoringSessionSummary;
};
type BackStackEntry =
  | { type: "settings" }
  | { type: "report"; destination: ReportDestination };

export function AppShell() {
  const colorScheme = useColorScheme();
  const [tab, setTab] = useState<Tab>("history");
  const [backStack, setBackStack] = useState<BackStackEntry[]>([]);
  const [backEdge, setBackEdge] = useState<"left" | "right">("left");
  const backProgress = useRef(new Animated.Value(0)).current;
  const backProgressRef = useRef(0);
  const reportScrollOffsetRef = useRef(0);
  const { accentSeed } = useSettingsViewModel();
  const alarmViewModel = useAlarmViewModel();
  const handleReportScrollOffsetChange = useCallback((offset: number) => {
    reportScrollOffsetRef.current = offset;
  }, []);
  const currentEntry = backStack.at(-1) ?? null;
  const canGoBack = currentEntry !== null;

  const resetBackProgress = useCallback(() => {
    backProgress.stopAnimation();
    backProgressRef.current = 0;
    backProgress.setValue(0);
  }, [backProgress]);

  const push = useCallback(
    (entry: BackStackEntry) => {
      resetBackProgress();
      setBackStack((entries) => [...entries, entry]);
    },
    [resetBackProgress]
  );

  const pop = useCallback(() => {
    resetBackProgress();
    setBackStack((entries) =>
      entries.length > 0 ? entries.slice(0, -1) : entries
    );
  }, [resetBackProgress]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!canGoBack) return false;
        pop();
        return true;
      }
    );
    return () => subscription.remove();
  }, [canGoBack, pop]);

  useEffect(() => {
    if (!predictiveBack.setPredictiveBackEnabled) return;
    void predictiveBack.setPredictiveBackEnabled(canGoBack).catch(() => {
      // BackHandler above remains the compatibility path if the native bridge
      // is unavailable on a particular build or Activity implementation.
    });
  }, [canGoBack]);

  useEffect(() => {
    if (!predictiveBack.setPredictiveBackEnabled) return;

    const subscription = predictiveBack.addListener(
      "onPredictiveBack",
      (event: PredictiveBackEvent) => {
        if (event.phase === "started") {
          backProgress.stopAnimation();
          backProgressRef.current = 0;
          setBackEdge(event.edge);
          backProgress.setValue(0);
          return;
        }

        if (event.phase === "progressed") {
          const progress = Math.min(1, Math.max(0, event.progress));
          backProgressRef.current = progress;
          backProgress.setValue(progress);
          return;
        }

        if (event.phase === "cancelled") {
          Animated.spring(backProgress, {
            toValue: 0,
            damping: 22,
            stiffness: 260,
            mass: 0.8,
            useNativeDriver: false
          }).start(() => {
            backProgressRef.current = 0;
          });
          return;
        }

        if (backProgressRef.current <= 0.02) {
          pop();
          return;
        }

        Animated.timing(backProgress, {
          toValue: 1,
          duration: 90,
          useNativeDriver: false
        }).start(pop);
      }
    );

    return () => subscription.remove();
  }, [backProgress, pop]);

  const secondaryTransform = {
    opacity: backProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.92]
    }),
    borderRadius: backProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 32]
    }),
    transform: [
      {
        translateX: backProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, backEdge === "left" ? 72 : -72]
        })
      },
      {
        scale: backProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.92]
        })
      }
    ]
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === "history" ? (
          <HistoryScreen
            onOpenSettings={() => push({ type: "settings" })}
            onOpenSession={(item) => {
              if (!item.session_id) return;
              push({
                type: "report",
                destination: {
                  query: createSessionReportQuery(item.session_id),
                  sessionSummary: item
                }
              });
            }}
          />
        ) : (
          <ReportScreen
            initialScrollOffset={reportScrollOffsetRef.current}
            onScrollOffsetChange={handleReportScrollOffsetChange}
            onOpenQuery={(query) =>
              push({ type: "report", destination: { query } })
            }
            onOpenSaved={(initialReport) =>
              push({
                type: "report",
                destination: {
                  query: initialReport.query,
                  initialReport
                }
              })
            }
          />
        )}
      </View>
      <View
        pointerEvents={currentEntry ? "none" : "auto"}
        style={currentEntry ? styles.navigationHidden : undefined}
      >
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
      </View>
      {currentEntry ? (
        <Animated.View style={[styles.secondary, secondaryTransform]}>
          {currentEntry.type === "report" ? (
            <ReportDetailScreen
              key={getReportCacheKey(currentEntry.destination.query)}
              query={currentEntry.destination.query}
              initialReport={currentEntry.destination.initialReport}
              sessionSummary={currentEntry.destination.sessionSummary}
              onBack={pop}
            />
          ) : (
            <SettingsScreen onBack={pop} />
          )}
        </Animated.View>
      ) : null}
      {alarmViewModel.active && !alarmViewModel.dismissed && alarmViewModel.alarm ? (
        <AlarmBanner alarm={alarmViewModel.alarm} onDismiss={alarmViewModel.dismiss} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  secondary: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    zIndex: 1
  },
  navigationHost: { width: "100%" },
  navigationHidden: { opacity: 0 }
});
