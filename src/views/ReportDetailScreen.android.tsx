import { useMemo, useRef, useState } from "react";
import {
  Animated,
  type ColorSchemeName,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text as NativeText,
  useColorScheme,
  View
} from "react-native";
import {
  Button,
  CircularWavyProgressIndicator,
  Column,
  FilledTonalButton,
  Host,
  Icon,
  IconButton,
  Row,
  Shape,
  Spacer,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  weight
} from "@expo/ui/jetpack-compose/modifiers";

import type {
  MonitoringReport,
  MonitoringSessionSummary,
  ReportQuery,
  SavedMonitoringReport
} from "../models/types";
import { ReportMarkdown } from "../ui/ReportMarkdown";
import {
  formatDateRange,
  formatRecordDay,
  formatRecordTime
} from "../ui/theme";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useReportViewModel } from "../viewmodels/useReportViewModel";

type ReportDetailScreenProps = {
  query: ReportQuery;
  initialReport?: SavedMonitoringReport;
  sessionSummary?: MonitoringSessionSummary;
  onBack: () => void;
};

const periodCopy = {
  session: {
    eyebrow: "单次监测",
    title: "本次照护分析",
    emptyTitle: "读懂这次监测",
    emptyDescription: "基于本次完整记录，分析可见度、活动、报警与采样质量。"
  },
  daily: {
    eyebrow: "日报",
    title: "今日观察",
    emptyTitle: "生成今天的观察报告",
    emptyDescription: "总结今天完整监测中的可见度、活动与报警表现。"
  },
  weekly: {
    eyebrow: "周报 · 7 天",
    title: "近期趋势",
    emptyTitle: "生成近 7 天趋势报告",
    emptyDescription: "比较每天的数据质量与变化方向，形成一份周期回顾。"
  },
  monthly: {
    eyebrow: "月报 · 30 天",
    title: "长期回顾",
    emptyTitle: "生成近 30 天回顾",
    emptyDescription: "梳理更长周期内的趋势、异常与有效观察范围。"
  }
} as const;

type PeriodCopy = (typeof periodCopy)[keyof typeof periodCopy];
type ReportViewModel = ReturnType<typeof useReportViewModel>;

const savedAtFormatter = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分钟`;
  return `${(seconds / 3600).toFixed(1)} 小时`;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 3 }}>
      <Text style={{ typography: "bodySmall" }}>{label}</Text>
      <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
        {value}
      </Text>
    </Column>
  );
}

function SessionSummary({ item }: { item: MonitoringSessionSummary }) {
  return (
    <Surface tonalElevation={1} shape={roundedShape(22)} modifiers={[fillMaxWidth()]}>
      <Column
        modifiers={[paddingAll(16)]}
        verticalArrangement={{ spacedBy: 10 }}
      >
        <Column verticalArrangement={{ spacedBy: 3 }}>
          <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
            {formatRecordDay(item.started_at)} · {formatRecordTime(item.started_at)}
          </Text>
          <Text style={{ typography: "bodySmall" }}>
            {formatDuration(item.duration_seconds)} · {item.sample_count} 条样本 · {item.alarm_event_count} 次报警
          </Text>
        </Column>
        <Row
          modifiers={[fillMaxWidth()]}
          horizontalArrangement={{ spacedBy: 12 }}
        >
          <SummaryMetric
            label="宝宝可见"
            value={
              item.average_baby_ratio === null
                ? "—"
                : `${item.average_baby_ratio.toFixed(0)}%`
            }
          />
          <SummaryMetric
            label="人脸可见"
            value={
              item.average_face_ratio === null
                ? "—"
                : `${item.average_face_ratio.toFixed(0)}%`
            }
          />
          <SummaryMetric
            label="平均活动"
            value={
              item.average_activity_level === null
                ? "—"
                : item.average_activity_level.toFixed(1)
            }
          />
        </Row>
      </Column>
    </Surface>
  );
}

function DetailHeader({
  copy,
  report,
  sessionSummary,
  isDark,
  accentSeed,
  colorScheme,
  onBack,
  viewModel
}: {
  copy: PeriodCopy;
  report: MonitoringReport | null;
  sessionSummary?: MonitoringSessionSummary;
  isDark: boolean;
  accentSeed: string | undefined;
  colorScheme: ColorSchemeName;
  onBack: () => void;
  viewModel: ReportViewModel;
}) {
  return (
    <Host
      matchContents={{ vertical: true }}
      style={styles.fullWidth}
      seedColor={accentSeed}
      colorScheme={colorScheme}
    >
      <Surface modifiers={[fillMaxWidth()]}>
        <Column
          modifiers={[padding(4, 6, 4, report ? 14 : 6)]}
          verticalArrangement={{ spacedBy: 8 }}
        >
          <Row
            modifiers={[fillMaxWidth(), padding(0, 0, 12, 0)]}
            verticalAlignment="center"
          >
            <IconButton onClick={onBack}>
              <Icon
                source={require("../assets/arrow_back.xml")}
                size={24}
                contentDescription="返回"
              />
            </IconButton>
            <Spacer modifiers={[weight(1)]} />
            {viewModel.savedReport ? (
              <Text style={{ typography: "labelMedium" }}>已保存在本机</Text>
            ) : null}
          </Row>

          <Column
            modifiers={[padding(16, 0, 16, 0)]}
            verticalArrangement={{ spacedBy: 12 }}
          >
            <Column verticalArrangement={{ spacedBy: 4 }}>
              <Text style={{ typography: "labelLarge", fontWeight: "700" }}>
                {copy.eyebrow}
              </Text>
              <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
                {copy.title}
              </Text>
            </Column>

            {sessionSummary ? <SessionSummary item={sessionSummary} /> : null}

            {report ? (
              <Column verticalArrangement={{ spacedBy: 10 }}>
                <Column verticalArrangement={{ spacedBy: 3 }}>
                  <Text style={{ typography: "bodyMedium", fontWeight: "600" }}>
                    {formatDateRange(report.start_at, report.end_at)} · {report.sample_count} 条样本
                  </Text>
                  <Text style={{ typography: "bodySmall" }}>
                    保存于 {savedAtFormatter.format(new Date(viewModel.savedReport!.savedAt))}
                  </Text>
                </Column>
                <Row
                  modifiers={[fillMaxWidth()]}
                  horizontalArrangement={{ spacedBy: 10 }}
                >
                  <FilledTonalButton
                    enabled={!viewModel.isSharing}
                    onClick={() => void viewModel.share()}
                    modifiers={[weight(1)]}
                  >
                    <Text>{viewModel.isSharing ? "正在打开…" : "分享"}</Text>
                  </FilledTonalButton>
                  {viewModel.canGenerate ? (
                    <Button
                      enabled={!viewModel.isGenerating}
                      onClick={() => void viewModel.generate()}
                      modifiers={[weight(1)]}
                    >
                      <Text>
                        {viewModel.isGenerating ? "正在更新…" : "重新生成"}
                      </Text>
                    </Button>
                  ) : null}
                </Row>
                {viewModel.isGenerating ? <CircularWavyProgressIndicator /> : null}
              </Column>
            ) : null}

            {viewModel.error ? (
              <Text
                color={isDark ? "#FFB4AB" : "#BA1A1A"}
                style={{ typography: "bodyMedium" }}
              >
                {viewModel.error}
              </Text>
            ) : null}
            {viewModel.storageNotice ? (
              <Text
                color={isDark ? "#FFB4AB" : "#BA1A1A"}
                style={{ typography: "bodySmall" }}
              >
                {viewModel.storageNotice}
              </Text>
            ) : null}
            {viewModel.shareError ? (
              <Text
                color={isDark ? "#FFB4AB" : "#BA1A1A"}
                style={{ typography: "bodySmall" }}
              >
                {viewModel.shareError}
              </Text>
            ) : null}
          </Column>
        </Column>
      </Surface>
    </Host>
  );
}

function CompactDetailBar({
  title,
  accentSeed,
  colorScheme,
  isSharing,
  opacity,
  onBack,
  onShare
}: {
  title: string;
  accentSeed: string | undefined;
  colorScheme: ColorSchemeName;
  isSharing: boolean;
  opacity: Animated.AnimatedInterpolation<number>;
  onBack: () => void;
  onShare: () => void;
}) {
  return (
    <Animated.View style={[styles.compactHeader, { opacity }]}>
      <Host
        matchContents={{ vertical: true }}
        style={styles.fullWidth}
        seedColor={accentSeed}
        colorScheme={colorScheme}
      >
        <Surface tonalElevation={3} modifiers={[fillMaxWidth()]}>
          <Row
            modifiers={[fillMaxWidth(), padding(4, 4, 4, 4)]}
            verticalAlignment="center"
          >
            <IconButton onClick={onBack}>
              <Icon
                source={require("../assets/arrow_back.xml")}
                size={24}
                contentDescription="返回"
              />
            </IconButton>
            <Text style={{ typography: "titleLarge", fontWeight: "700" }}>
              {title}
            </Text>
            <Spacer modifiers={[weight(1)]} />
            <IconButton enabled={!isSharing} onClick={onShare}>
              <Icon
                source={require("../assets/share.xml")}
                size={24}
                contentDescription="分享报告"
              />
            </IconButton>
          </Row>
        </Surface>
      </Host>
    </Animated.View>
  );
}

export function ReportDetailScreen({
  query,
  initialReport,
  sessionSummary,
  onBack
}: ReportDetailScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { accentSeed } = useSettingsViewModel();
  const viewModel = useReportViewModel({ query, initialReport });
  const copy = periodCopy[query.period];
  const report = viewModel.savedReport?.report ?? null;
  const scrollY = useRef(new Animated.Value(0)).current;
  const compactVisibleRef = useRef(false);
  const [compactVisible, setCompactVisible] = useState(false);
  const compactOpacity = scrollY.interpolate({
    inputRange: [90, 160],
    outputRange: [0, 1],
    extrapolate: "clamp"
  });
  const handleReportScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: true,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const nextVisible = event.nativeEvent.contentOffset.y > 80;
            if (compactVisibleRef.current !== nextVisible) {
              compactVisibleRef.current = nextVisible;
              setCompactVisible(nextVisible);
            }
          }
        }
      ),
    [scrollY]
  );
  const detailHeader = (
    <DetailHeader
      copy={copy}
      report={report}
      sessionSummary={sessionSummary}
      isDark={isDark}
      accentSeed={accentSeed}
      colorScheme={colorScheme}
      onBack={onBack}
      viewModel={viewModel}
    />
  );

  return (
    <View
      style={[styles.root, { backgroundColor: isDark ? "#141218" : "#FFFBFE" }]}
    >
      {viewModel.isRestoring ? (
        <>
          {detailHeader}
          <Host
            style={styles.placeholderHost}
            seedColor={accentSeed}
            colorScheme={colorScheme}
          >
            <Surface modifiers={[fillMaxSize()]}>
              <Column
                modifiers={[fillMaxSize()]}
                horizontalAlignment="center"
                verticalArrangement="center"
              >
                <CircularWavyProgressIndicator />
                <Text>正在查找本机报告…</Text>
              </Column>
            </Surface>
          </Host>
        </>
      ) : report ? (
        <>
          <Animated.ScrollView
            contentContainerStyle={styles.reportScroll}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleReportScroll}
          >
            {detailHeader}
            <View
              style={[
                styles.reportCard,
                { backgroundColor: isDark ? "#211F26" : "#F7F2FA" }
              ]}
            >
              <ReportMarkdown markdown={report.report} isDark={isDark} />
            </View>
            <NativeText
              style={[
                styles.disclaimer,
                { color: isDark ? "#CAC4D0" : "#625B71" }
              ]}
            >
              报告仅依据已记录数据生成，不构成医疗诊断或安全保证。
            </NativeText>
          </Animated.ScrollView>
          {compactVisible ? (
            <CompactDetailBar
              title={copy.title}
              accentSeed={accentSeed}
              colorScheme={colorScheme}
              isSharing={viewModel.isSharing}
              opacity={compactOpacity}
              onBack={onBack}
              onShare={() => void viewModel.share()}
            />
          ) : null}
        </>
      ) : (
        <>
          {detailHeader}
          <Host
            style={styles.placeholderHost}
            seedColor={accentSeed}
            colorScheme={colorScheme}
          >
            <Surface modifiers={[fillMaxSize()]}>
              <Column
                modifiers={[fillMaxSize(), paddingAll(28)]}
                horizontalAlignment="center"
                verticalArrangement="center"
              >
                <Icon
                  source={require("../assets/insights.xml")}
                  size={52}
                  contentDescription={copy.emptyTitle}
                />
                <Text
                  style={{
                    typography: "headlineSmall",
                    fontWeight: "700",
                    textAlign: "center"
                  }}
                >
                  {copy.emptyTitle}
                </Text>
                <Text style={{ typography: "bodyLarge", textAlign: "center" }}>
                  {copy.emptyDescription}
                </Text>
                {viewModel.canGenerate ? (
                  <Button
                    enabled={!viewModel.isGenerating}
                    onClick={() => void viewModel.generate()}
                    modifiers={[fillMaxWidth()]}
                  >
                    <Text>
                      {viewModel.isGenerating
                        ? "正在分析监测数据…"
                        : "生成报告"}
                    </Text>
                  </Button>
                ) : (
                  <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                    这是过去保存的周期报告，只能查看与分享。
                  </Text>
                )}
                {viewModel.isGenerating ? <CircularWavyProgressIndicator /> : null}
              </Column>
            </Surface>
          </Host>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullWidth: { width: "100%" },
  placeholderHost: { flex: 1, width: "100%" },
  reportScroll: { paddingBottom: 32 },
  reportCard: {
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 20
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    marginHorizontal: 24,
    paddingTop: 14
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0
  }
});
