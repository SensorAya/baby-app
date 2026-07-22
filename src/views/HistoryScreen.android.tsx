import { useColorScheme } from "react-native";
import {
  Button,
  Card,
  CircularWavyProgressIndicator,
  Column,
  FilledTonalButton,
  FilledTonalIconButton,
  Host,
  Icon,
  LazyColumn,
  LinearProgressIndicator,
  PullToRefreshBox,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
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

import type { MonitoringSessionSummary } from "../models/types";
import { formatRecordDay, formatRecordTime } from "../ui/theme";
import { useAuthViewModel } from "../viewmodels/AuthViewModel";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useMonitoringHistoryViewModel } from "../viewmodels/useMonitoringHistoryViewModel";

type HistoryScreenProps = { onOpenSettings: () => void };

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分钟`;
  return `${(seconds / 3600).toFixed(1)} 小时`;
}

function SessionCard({ item }: { item: MonitoringSessionSummary }) {
  const activity = item.average_activity_level ?? 0;
  const activityLabel = activity < 10 ? "静止" : activity <= 30 ? "微动" : "大幅翻动";
  return (
    <Card modifiers={[fillMaxWidth()]} elevation={item.alarm_event_count ? 2 : 0}>
      <Column modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 10 }}>
        <Row horizontalArrangement="spaceBetween" verticalAlignment="center">
          <Column>
            <Text style={{ typography: "titleMedium", fontWeight: "700" }}>
              {formatRecordDay(item.started_at)} · {formatRecordTime(item.started_at)}
            </Text>
            <Text style={{ typography: "bodySmall" }}>
              {item.session_count} 次完整监测 · {formatDuration(item.duration_seconds)} · {item.sample_count} 个心跳
            </Text>
          </Column>
          <Text style={{ typography: "labelLarge", fontWeight: "700" }}>
            {item.alarm_event_count > 0 ? `报警 ${item.alarm_event_count}` : "无报警"}
          </Text>
        </Row>
        <Row modifiers={[fillMaxWidth()]} horizontalArrangement={{ spacedBy: 16 }}>
          <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 4 }}>
            <Text style={{ typography: "bodySmall" }}>宝宝平均可见度</Text>
            <Text style={{ typography: "titleLarge", fontWeight: "700" }}>
              {item.average_baby_ratio?.toFixed(1) ?? "—"}%
            </Text>
          </Column>
          <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 4 }}>
            <Text style={{ typography: "bodySmall" }}>人脸平均可见度</Text>
            <Text style={{ typography: "titleLarge", fontWeight: "700" }}>
              {item.average_face_ratio?.toFixed(1) ?? "—"}%
            </Text>
          </Column>
        </Row>
        <Text style={{ typography: "bodySmall" }}>
          活动水平 {activity.toFixed(1)} · {activityLabel}
        </Text>
        <LinearProgressIndicator progress={activity / 100} modifiers={[fillMaxWidth()]} />
        <Text style={{ typography: "bodySmall" }}>
          静止 {item.stationary_sample_count} · 微动 {item.minor_activity_sample_count} · 大幅翻动 {item.major_activity_sample_count}
        </Text>
      </Column>
    </Card>
  );
}

export function HistoryScreen({ onOpenSettings }: HistoryScreenProps) {
  const colorScheme = useColorScheme();
  const viewModel = useMonitoringHistoryViewModel();
  const { user } = useAuthViewModel();
  const { accentSeed } = useSettingsViewModel();

  return (
    <Host style={{ flex: 1 }} seedColor={accentSeed} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column modifiers={[fillMaxSize()]}>
          <Column
            modifiers={[fillMaxWidth(), padding(20, 20, 20, 12)]}
            verticalArrangement={{ spacedBy: 10 }}
          >
            <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
              <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
                监测历史
              </Text>
              <Spacer modifiers={[weight(1)]} />
              <FilledTonalIconButton onClick={onOpenSettings}>
                <Icon source={require("../assets/settings.xml")} size={24} contentDescription="设置" />
              </FilledTonalIconButton>
            </Row>
            <Text style={{ typography: "bodyMedium" }}>
              {user?.email ?? "当前用户"} · 仅统计 start → stop 的完整监测
            </Text>
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              <SegmentedButton selected={viewModel.period === "session"} onClick={() => viewModel.setPeriod("session")}>
                <SegmentedButton.Label><Text>按次</Text></SegmentedButton.Label>
              </SegmentedButton>
              <SegmentedButton selected={viewModel.period === "daily"} onClick={() => viewModel.setPeriod("daily")}>
                <SegmentedButton.Label><Text>按天</Text></SegmentedButton.Label>
              </SegmentedButton>
              <SegmentedButton selected={viewModel.period === "weekly"} onClick={() => viewModel.setPeriod("weekly")}>
                <SegmentedButton.Label><Text>按周</Text></SegmentedButton.Label>
              </SegmentedButton>
              <SegmentedButton selected={viewModel.period === "monthly"} onClick={() => viewModel.setPeriod("monthly")}>
                <SegmentedButton.Label><Text>按月</Text></SegmentedButton.Label>
              </SegmentedButton>
            </SingleChoiceSegmentedButtonRow>
          </Column>

          {viewModel.isLoading ? (
            <Column modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center">
              <CircularWavyProgressIndicator />
              <Text>正在读取完整监测…</Text>
            </Column>
          ) : viewModel.error && viewModel.items.length === 0 ? (
            <Column modifiers={[fillMaxSize(), paddingAll(24)]} horizontalAlignment="center" verticalArrangement="center">
              <Text style={{ typography: "titleMedium", textAlign: "center" }}>{viewModel.error}</Text>
              <Button onClick={() => void viewModel.retry()}><Text>重新加载</Text></Button>
            </Column>
          ) : viewModel.items.length === 0 ? (
            <PullToRefreshBox isRefreshing={viewModel.isRefreshing} onRefresh={() => void viewModel.refresh()} contentAlignment="topCenter" modifiers={[fillMaxSize()]}>
              <LazyColumn modifiers={[fillMaxSize()]} horizontalAlignment="center" verticalArrangement="center" contentPadding={{ start: 24, top: 24, end: 24, bottom: 24 }}>
                <Icon source={require("../assets/history.xml")} size={48} contentDescription="暂无完整监测" />
                <Text style={{ typography: "headlineSmall" }}>暂无完整监测</Text>
                <Text style={{ typography: "bodyMedium", textAlign: "center" }}>收到 start 与 stop 心跳后，会在这里形成一次监测。</Text>
              </LazyColumn>
            </PullToRefreshBox>
          ) : (
            <PullToRefreshBox isRefreshing={viewModel.isRefreshing} onRefresh={() => void viewModel.refresh()} contentAlignment="topCenter" modifiers={[fillMaxSize()]}>
              <LazyColumn modifiers={[fillMaxSize()]} contentPadding={{ start: 16, top: 8, end: 16, bottom: 24 }} verticalArrangement={{ spacedBy: 12 }}>
                <Text style={{ typography: "bodyMedium" }}>共 {viewModel.total} 个聚合单位</Text>
                {viewModel.error ? (
                  <Card modifiers={[fillMaxWidth()]} elevation={0}>
                    <Column modifiers={[paddingAll(14)]} verticalArrangement={{ spacedBy: 6 }}>
                      <Text>{viewModel.error}</Text>
                      <TextButton onClick={() => void viewModel.retry()}><Text>重新加载</Text></TextButton>
                    </Column>
                  </Card>
                ) : null}
                {viewModel.items.map((item) => <SessionCard key={item.key} item={item} />)}
                {viewModel.hasMore ? (
                  <Column verticalArrangement={{ spacedBy: 4 }}>
                    {viewModel.loadMoreError ? <Text style={{ typography: "bodySmall", textAlign: "center" }}>{viewModel.loadMoreError}</Text> : null}
                    <FilledTonalButton enabled={!viewModel.isLoadingMore} onClick={() => void viewModel.loadMore()} modifiers={[fillMaxWidth()]}>
                      <Text>{viewModel.isLoadingMore ? "正在加载…" : "加载更多"}</Text>
                    </FilledTonalButton>
                  </Column>
                ) : <Text style={{ typography: "bodySmall", textAlign: "center" }}>已显示全部 {viewModel.items.length} 项</Text>}
              </LazyColumn>
            </PullToRefreshBox>
          )}
        </Column>
      </Surface>
    </Host>
  );
}
