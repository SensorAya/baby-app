import { useColorScheme } from "react-native";
import {
  Button,
  CircularWavyProgressIndicator,
  Column,
  FilledTonalButton,
  FilledTonalIconButton,
  FilterChip,
  Host,
  Icon,
  LazyColumn,
  LazyRow,
  PullToRefreshBox,
  Row,
  Shape,
  Spacer,
  Surface,
  Text,
  TextButton
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  weight
} from "@expo/ui/jetpack-compose/modifiers";

import type {
  MonitoringPeriod,
  MonitoringSessionSummary
} from "../models/types";
import { formatRecordDay, formatRecordTime } from "../ui/theme";
import { useAuthViewModel } from "../viewmodels/AuthViewModel";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useMonitoringHistoryViewModel } from "../viewmodels/useMonitoringHistoryViewModel";

type HistoryScreenProps = {
  onOpenSettings: () => void;
  onOpenSession: (item: MonitoringSessionSummary) => void;
};

const periodOptions: ReadonlyArray<{
  period: MonitoringPeriod;
  label: string;
  unit: string;
}> = [
  { period: "session", label: "每次监测", unit: "次" },
  { period: "daily", label: "按天", unit: "天" },
  { period: "weekly", label: "按周", unit: "周" },
  { period: "monthly", label: "按月", unit: "月" }
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分钟`;
  return `${(seconds / 3600).toFixed(1)} 小时`;
}

function getActivityLabel(activity: number): string {
  return activity < 10 ? "安静" : activity <= 30 ? "轻微活动" : "活动明显";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 3 }}>
      <Text style={{ typography: "bodySmall" }}>{label}</Text>
      <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
        {value}
      </Text>
    </Column>
  );
}

function MonitoringCard({
  item,
  isDark,
  onOpenSession
}: {
  item: MonitoringSessionSummary;
  isDark: boolean;
  onOpenSession: (item: MonitoringSessionSummary) => void;
}) {
  const activity = item.average_activity_level ?? 0;
  const canOpen = item.period === "session" && Boolean(item.session_id);
  const title =
    item.period === "session"
      ? `${formatRecordDay(item.started_at)} · ${formatRecordTime(item.started_at)}`
      : formatRecordDay(item.started_at);

  return (
    <Surface
      onClick={canOpen ? () => onOpenSession(item) : undefined}
      tonalElevation={item.alarm_event_count > 0 ? 2 : 1}
      shape={roundedShape(24)}
      modifiers={[fillMaxWidth()]}
    >
      <Column
        modifiers={[paddingAll(18)]}
        verticalArrangement={{ spacedBy: 12 }}
      >
        <Column verticalArrangement={{ spacedBy: 5 }}>
          <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
            <Text style={{ typography: "labelLarge", fontWeight: "700" }}>
              {item.session_count > 1 ? `${item.session_count} 次完整监测` : "完整监测"}
            </Text>
            <Spacer modifiers={[weight(1)]} />
            <Text
              color={
                item.alarm_event_count > 0
                  ? isDark
                    ? "#FFB4AB"
                    : "#BA1A1A"
                  : undefined
              }
              style={{ typography: "labelMedium", fontWeight: "600" }}
            >
              {item.alarm_event_count > 0
                ? `${item.alarm_event_count} 次报警`
                : "状态平稳"}
            </Text>
          </Row>
          <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
            {title}
          </Text>
          <Text style={{ typography: "bodySmall" }}>
            {formatDuration(item.duration_seconds)} · {item.sample_count} 条样本
          </Text>
        </Column>

        <Row
          modifiers={[fillMaxWidth()]}
          horizontalArrangement={{ spacedBy: 14 }}
        >
          <Metric
            label="宝宝可见"
            value={
              item.average_baby_ratio === null
                ? "—"
                : `${item.average_baby_ratio.toFixed(0)}%`
            }
          />
          <Metric
            label="人脸可见"
            value={
              item.average_face_ratio === null
                ? "—"
                : `${item.average_face_ratio.toFixed(0)}%`
            }
          />
          <Metric label="活动" value={getActivityLabel(activity)} />
        </Row>

        {canOpen ? (
          <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
            <Text style={{ typography: "labelLarge", fontWeight: "700" }}>
              查看本次详情与分析
            </Text>
            <Spacer modifiers={[weight(1)]} />
            <Text style={{ typography: "titleLarge" }}>›</Text>
          </Row>
        ) : null}
      </Column>
    </Surface>
  );
}

export function HistoryScreen({
  onOpenSettings,
  onOpenSession
}: HistoryScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const viewModel = useMonitoringHistoryViewModel();
  const { user } = useAuthViewModel();
  const { accentSeed } = useSettingsViewModel();
  const selectedUnit =
    periodOptions.find((option) => option.period === viewModel.period)?.unit ??
    "项";

  return (
    <Host style={{ flex: 1 }} seedColor={accentSeed} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column modifiers={[fillMaxSize()]}>
          <Column
            modifiers={[fillMaxWidth(), padding(20, 20, 20, 10)]}
            verticalArrangement={{ spacedBy: 10 }}
          >
            <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
              <Column verticalArrangement={{ spacedBy: 3 }}>
                <Text
                  style={{ typography: "headlineMedium", fontWeight: "700" }}
                >
                  照护记录
                </Text>
                <Text style={{ typography: "bodySmall" }}>
                  {user?.email ?? "当前用户"}
                </Text>
              </Column>
              <Spacer modifiers={[weight(1)]} />
              <FilledTonalIconButton onClick={onOpenSettings}>
                <Icon
                  source={require("../assets/settings.xml")}
                  size={24}
                  contentDescription="设置"
                />
              </FilledTonalIconButton>
            </Row>
            <LazyRow
              modifiers={[fillMaxWidth()]}
              horizontalArrangement={{ spacedBy: 8 }}
            >
              {periodOptions.map((option) => (
                <FilterChip
                  key={option.period}
                  selected={viewModel.period === option.period}
                  onClick={() => viewModel.setPeriod(option.period)}
                >
                  <FilterChip.Label>
                    <Text>{option.label}</Text>
                  </FilterChip.Label>
                </FilterChip>
              ))}
            </LazyRow>
          </Column>

          {viewModel.isLoading ? (
            <Column
              modifiers={[fillMaxSize()]}
              horizontalAlignment="center"
              verticalArrangement="center"
            >
              <CircularWavyProgressIndicator />
              <Text>正在整理监测记录…</Text>
            </Column>
          ) : viewModel.error && viewModel.items.length === 0 ? (
            <Column
              modifiers={[fillMaxSize(), paddingAll(24)]}
              horizontalAlignment="center"
              verticalArrangement="center"
            >
              <Text style={{ typography: "titleMedium", textAlign: "center" }}>
                {viewModel.error}
              </Text>
              <Button onClick={() => void viewModel.retry()}>
                <Text>重新加载</Text>
              </Button>
            </Column>
          ) : viewModel.items.length === 0 ? (
            <PullToRefreshBox
              isRefreshing={viewModel.isRefreshing}
              onRefresh={() => void viewModel.refresh()}
              contentAlignment="topCenter"
              modifiers={[fillMaxSize()]}
            >
              <LazyColumn
                modifiers={[fillMaxSize()]}
                horizontalAlignment="center"
                verticalArrangement="center"
                contentPadding={{ start: 24, top: 24, end: 24, bottom: 24 }}
              >
                <Icon
                  source={require("../assets/history.xml")}
                  size={48}
                  contentDescription="暂无完整监测"
                />
                <Text style={{ typography: "headlineSmall", fontWeight: "700" }}>
                  暂无完整监测
                </Text>
                <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                  收到 start 与 stop 心跳后，会在这里形成一次记录。
                </Text>
              </LazyColumn>
            </PullToRefreshBox>
          ) : (
            <PullToRefreshBox
              isRefreshing={viewModel.isRefreshing}
              onRefresh={() => void viewModel.refresh()}
              contentAlignment="topCenter"
              modifiers={[fillMaxSize()]}
            >
              <LazyColumn
                modifiers={[fillMaxSize()]}
                contentPadding={{ start: 16, top: 8, end: 16, bottom: 28 }}
                verticalArrangement={{ spacedBy: 12 }}
              >
                <Row
                  modifiers={[fillMaxWidth(), padding(2, 0, 2, 2)]}
                  verticalAlignment="center"
                >
                  <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
                    {viewModel.total} {selectedUnit}记录
                  </Text>
                  <Spacer modifiers={[weight(1)]} />
                  <Text style={{ typography: "bodySmall" }}>下拉即可刷新</Text>
                </Row>
                {viewModel.error ? (
                  <Surface
                    tonalElevation={1}
                    shape={roundedShape(18)}
                    modifiers={[fillMaxWidth()]}
                  >
                    <Column
                      modifiers={[paddingAll(14)]}
                      verticalArrangement={{ spacedBy: 6 }}
                    >
                      <Text>{viewModel.error}</Text>
                      <TextButton onClick={() => void viewModel.retry()}>
                        <Text>重新加载</Text>
                      </TextButton>
                    </Column>
                  </Surface>
                ) : null}
                {viewModel.items.map((item) => (
                  <MonitoringCard
                    key={item.key}
                    item={item}
                    isDark={isDark}
                    onOpenSession={onOpenSession}
                  />
                ))}
                {viewModel.hasMore ? (
                  <Column verticalArrangement={{ spacedBy: 6 }}>
                    {viewModel.loadMoreError ? (
                      <Text style={{ typography: "bodySmall", textAlign: "center" }}>
                        {viewModel.loadMoreError}
                      </Text>
                    ) : null}
                    <FilledTonalButton
                      enabled={!viewModel.isLoadingMore}
                      onClick={() => void viewModel.loadMore()}
                      modifiers={[fillMaxWidth()]}
                    >
                      <Text>
                        {viewModel.isLoadingMore ? "正在加载…" : "加载更多"}
                      </Text>
                    </FilledTonalButton>
                  </Column>
                ) : (
                  <Text style={{ typography: "bodySmall", textAlign: "center" }}>
                    已显示全部记录
                  </Text>
                )}
              </LazyColumn>
            </PullToRefreshBox>
          )}
        </Column>
      </Surface>
    </Host>
  );
}
