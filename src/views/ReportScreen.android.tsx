import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  StyleSheet,
  useColorScheme,
  View
} from "react-native";
import {
  AlertDialog,
  CircularWavyProgressIndicator,
  Column,
  Host,
  Icon,
  Row,
  Shape,
  Spacer,
  Surface,
  Text,
  TextButton
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  paddingAll,
  weight
} from "@expo/ui/jetpack-compose/modifiers";

import type {
  CalendarReportPeriod,
  ReportQuery,
  SavedMonitoringReport
} from "../models/types";
import {
  createCalendarReportQuery,
  getReportCacheKey
} from "../services/reportStorage";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useReportLibraryViewModel } from "../viewmodels/useReportViewModel";
import { SwipeableReportCard } from "./SwipeableReportCard.android";

type ReportScreenProps = {
  initialScrollOffset: number;
  onScrollOffsetChange: (offset: number) => void;
  onOpenQuery: (query: ReportQuery) => void;
  onOpenSaved: (report: SavedMonitoringReport) => void;
};

const periodOptions: ReadonlyArray<{
  period: CalendarReportPeriod;
  title: string;
  eyebrow: string;
  description: string;
}> = [
  {
    period: "daily",
    title: "今日观察",
    eyebrow: "日报",
    description: "聚焦今天的可见度、活动与报警变化"
  },
  {
    period: "weekly",
    title: "近 7 天趋势",
    eyebrow: "周报",
    description: "对比每天的有效观察与变化方向"
  },
  {
    period: "monthly",
    title: "近 30 天回顾",
    eyebrow: "月报",
    description: "梳理较长期的趋势、异常与数据质量"
  }
];

function roundedShape(radius: number) {
  return Shape.RoundedCorner({
    cornerRadii: {
      topStart: radius,
      topEnd: radius,
      bottomStart: radius,
      bottomEnd: radius
    }
  });
}

function PeriodCard({
  title,
  eyebrow,
  description,
  cached,
  onClick
}: (typeof periodOptions)[number] & {
  cached: boolean;
  onClick: () => void;
}) {
  return (
    <Surface
      onClick={onClick}
      tonalElevation={cached ? 2 : 1}
      shape={roundedShape(24)}
      modifiers={[fillMaxWidth()]}
    >
      <Column
        modifiers={[paddingAll(18)]}
        verticalArrangement={{ spacedBy: 8 }}
      >
        <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
          <Text style={{ typography: "labelLarge", fontWeight: "700" }}>
            {eyebrow}
          </Text>
          <Spacer modifiers={[weight(1)]} />
          <Text style={{ typography: "labelMedium" }}>
            {cached ? "本机已有 · 查看 ›" : "开始 ›"}
          </Text>
        </Row>
        <Text style={{ typography: "titleLarge", fontWeight: "700" }}>
          {title}
        </Text>
        <Text style={{ typography: "bodyMedium" }}>{description}</Text>
      </Column>
    </Surface>
  );
}

export function ReportScreen({
  initialScrollOffset,
  onScrollOffsetChange,
  onOpenQuery,
  onOpenSaved
}: ReportScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { accentSeed } = useSettingsViewModel();
  const viewModel = useReportLibraryViewModel();
  const [deleteCandidate, setDeleteCandidate] =
    useState<SavedMonitoringReport | null>(null);
  const scrollY = useRef(new Animated.Value(initialScrollOffset)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const restoredScrollRef = useRef(initialScrollOffset <= 0);
  const currentQueries = periodOptions.map((option) => ({
    ...option,
    query: createCalendarReportQuery(option.period)
  }));
  const savedKeys = new Set(
    viewModel.reports.map((report) => report.cacheKey)
  );
  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [110, 180],
    outputRange: [0, 1],
    extrapolate: "clamp"
  });
  const compactHeaderTranslate = scrollY.interpolate({
    inputRange: [110, 180],
    outputRange: [-18, 0],
    extrapolate: "clamp"
  });
  const visibleError = viewModel.actionError ?? viewModel.error;
  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            onScrollOffsetChange(event.nativeEvent.contentOffset.y);
          }
        }
      ),
    [onScrollOffsetChange, scrollY]
  );

  useEffect(() => {
    if (viewModel.isLoading || restoredScrollRef.current) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialScrollOffset,
        animated: false
      });
      scrollY.setValue(initialScrollOffset);
      restoredScrollRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [initialScrollOffset, scrollY, viewModel.isLoading]);

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const report = deleteCandidate;
    setDeleteCandidate(null);
    await viewModel.removeSavedReport(report);
  };

  return (
    <View
      style={[styles.root, { backgroundColor: isDark ? "#141218" : "#FFFBFE" }]}
    >
      <Animated.ScrollView
        ref={scrollRef}
        contentOffset={{ x: 0, y: initialScrollOffset }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        <Host
          matchContents={{ vertical: true }}
          style={styles.fullWidth}
          seedColor={accentSeed}
          colorScheme={colorScheme}
        >
          <Surface modifiers={[fillMaxWidth()]}>
            <Column verticalArrangement={{ spacedBy: 14 }}>
              <Column
                modifiers={[padding(4, 4, 4, 10)]}
                verticalArrangement={{ spacedBy: 8 }}
              >
                <Text
                  style={{ typography: "headlineMedium", fontWeight: "700" }}
                >
                  报告中心
                </Text>
                <Text style={{ typography: "bodyLarge" }}>
                  从近期监测中提炼值得关注的变化。
                </Text>
                <Text style={{ typography: "bodySmall" }}>
                  每次生成都会保存在本机，重复查看无需再次请求。
                </Text>
              </Column>

              {currentQueries.map(({ query, ...option }) => (
                <PeriodCard
                  key={option.period}
                  {...option}
                  cached={savedKeys.has(getReportCacheKey(query))}
                  onClick={() => onOpenQuery(query)}
                />
              ))}

              <Column
                modifiers={[padding(4, 14, 4, 2)]}
                verticalArrangement={{ spacedBy: 4 }}
              >
                <Text style={{ typography: "titleLarge", fontWeight: "700" }}>
                  已保存报告
                </Text>
                <Text style={{ typography: "bodySmall" }}>
                  右滑删除，左滑分享；点击可阅读完整报告。
                </Text>
              </Column>

              {visibleError ? (
                <Surface
                  tonalElevation={1}
                  shape={roundedShape(18)}
                  modifiers={[fillMaxWidth()]}
                >
                  <Column
                    modifiers={[paddingAll(14)]}
                    verticalArrangement={{ spacedBy: 6 }}
                  >
                    <Text>{visibleError}</Text>
                    {viewModel.error ? (
                      <TextButton onClick={() => void viewModel.refresh()}>
                        <Text>重新读取</Text>
                      </TextButton>
                    ) : null}
                  </Column>
                </Surface>
              ) : null}
            </Column>
          </Surface>
        </Host>

        {viewModel.isLoading ? (
          <Host
            matchContents={{ vertical: true }}
            style={styles.fullWidth}
            seedColor={accentSeed}
            colorScheme={colorScheme}
          >
            <Surface modifiers={[fillMaxWidth()]}>
              <Column
                modifiers={[fillMaxWidth(), paddingAll(28)]}
                horizontalAlignment="center"
                verticalArrangement={{ spacedBy: 10 }}
              >
                <CircularWavyProgressIndicator />
                <Text style={{ typography: "bodyMedium" }}>正在读取本机报告…</Text>
              </Column>
            </Surface>
          </Host>
        ) : viewModel.reports.length === 0 ? (
          <Host
            matchContents={{ vertical: true }}
            style={styles.fullWidth}
            seedColor={accentSeed}
            colorScheme={colorScheme}
          >
            <Surface modifiers={[fillMaxWidth()]}>
              <Column
                modifiers={[fillMaxWidth(), paddingAll(28)]}
                horizontalAlignment="center"
                verticalArrangement={{ spacedBy: 10 }}
              >
                <Icon
                  source={require("../assets/insights.xml")}
                  size={42}
                  contentDescription="暂无本地报告"
                />
                <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
                  还没有保存的报告
                </Text>
                <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                  选择上方周期，或从单次监测记录进入分析。
                </Text>
              </Column>
            </Surface>
          </Host>
        ) : (
          viewModel.reports.map((savedReport) => (
            <SwipeableReportCard
              key={savedReport.cacheKey}
              savedReport={savedReport}
              accentSeed={accentSeed}
              colorScheme={colorScheme}
              onOpen={() => onOpenSaved(savedReport)}
              onDelete={() => setDeleteCandidate(savedReport)}
              onShare={() => void viewModel.shareSavedReport(savedReport)}
            />
          ))
        )}
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.compactHeader,
          {
            opacity: compactHeaderOpacity,
            transform: [{ translateY: compactHeaderTranslate }]
          }
        ]}
      >
        <Host
          matchContents={{ vertical: true }}
          style={styles.fullWidth}
          seedColor={accentSeed}
          colorScheme={colorScheme}
        >
          <Surface tonalElevation={3} modifiers={[fillMaxWidth()]}>
            <Row
              modifiers={[fillMaxWidth(), padding(20, 12, 20, 12)]}
              verticalAlignment="center"
            >
              <Text style={{ typography: "titleLarge", fontWeight: "700" }}>
                报告中心
              </Text>
              <Spacer modifiers={[weight(1)]} />
              <Text style={{ typography: "labelMedium" }}>
                本机 {viewModel.reports.length} 份
              </Text>
            </Row>
          </Surface>
        </Host>
      </Animated.View>

      {deleteCandidate ? (
        <Host
          style={styles.dialogHost}
          seedColor={accentSeed}
          colorScheme={colorScheme}
        >
          <AlertDialog onDismissRequest={() => setDeleteCandidate(null)}>
            <AlertDialog.Icon>
              <Icon
                source={require("../assets/delete.xml")}
                size={24}
                contentDescription="删除报告"
              />
            </AlertDialog.Icon>
            <AlertDialog.Title>
              <Text>删除这份报告？</Text>
            </AlertDialog.Title>
            <AlertDialog.Text>
              <Text>删除后无法恢复；需要时可以重新生成当前周期报告。</Text>
            </AlertDialog.Text>
            <AlertDialog.ConfirmButton>
              <TextButton onClick={() => void confirmDelete()}>
                <Text>删除</Text>
              </TextButton>
            </AlertDialog.ConfirmButton>
            <AlertDialog.DismissButton>
              <TextButton onClick={() => setDeleteCandidate(null)}>
                <Text>取消</Text>
              </TextButton>
            </AlertDialog.DismissButton>
          </AlertDialog>
        </Host>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullWidth: { width: "100%" },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0
  },
  dialogHost: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
});
