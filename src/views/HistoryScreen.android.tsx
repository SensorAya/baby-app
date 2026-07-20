import { useColorScheme } from "react-native";
import {
  Button,
  Card,
  CircularWavyProgressIndicator,
  Column,
  FilledTonalIconButton,
  FilledTonalButton,
  Host,
  Icon,
  LazyColumn,
  LinearProgressIndicator,
  PullToRefreshBox,
  Row,
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

import type { MonitoringRecord } from "../models/types";
import {
  formatRecordDay,
  formatRecordTime,
  getRecordDayKey
} from "../ui/theme";
import { useAuthViewModel } from "../viewmodels/AuthViewModel";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useMonitoringHistoryViewModel } from "../viewmodels/useMonitoringHistoryViewModel";

type RecordGroup = {
  key: string;
  label: string;
  records: MonitoringRecord[];
};

type HistoryScreenProps = {
  onOpenSettings: () => void;
};

function groupRecords(records: MonitoringRecord[]): RecordGroup[] {
  const groups: RecordGroup[] = [];
  for (const record of records) {
    const key = getRecordDayKey(record.timestamp);
    const currentGroup = groups.at(-1);
    if (currentGroup?.key === key) currentGroup.records.push(record);
    else {
      groups.push({
        key,
        label: formatRecordDay(record.timestamp),
        records: [record]
      });
    }
  }
  return groups;
}

function RecordCard({
  record,
  isDark
}: {
  record: MonitoringRecord;
  isDark: boolean;
}) {
  const statusColor = record.alarm_active
    ? isDark
      ? "#FFB4AB"
      : "#BA1A1A"
    : isDark
      ? "#A5D6A7"
      : "#2E7D32";

  return (
    <Card modifiers={[fillMaxWidth()]} elevation={record.alarm_active ? 2 : 0}>
      <Column modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 10 }}>
        <Row horizontalArrangement="spaceBetween" verticalAlignment="center">
          <Column>
            <Text style={{ typography: "titleMedium", fontWeight: "600" }}>
              {formatRecordTime(record.timestamp)}
            </Text>
            <Text style={{ typography: "bodySmall" }}>记录 #{record.id.slice(0, 8)}</Text>
          </Column>
          <Text
            color={statusColor}
            style={{ typography: "labelLarge", fontWeight: "700" }}
          >
            {record.alarm_active ? "● 报警" : "● 正常"}
          </Text>
        </Row>
        <Row
          modifiers={[fillMaxWidth()]}
          horizontalArrangement={{ spacedBy: 16 }}
        >
          <Column modifiers={[weight(1)]} verticalArrangement={{ spacedBy: 6 }}>
            <Text style={{ typography: "bodySmall" }}>宝宝画面占比</Text>
            <Text style={{ typography: "headlineSmall", fontWeight: "700" }}>
              {record.baby_ratio}%
            </Text>
            <LinearProgressIndicator
              progress={record.baby_ratio / 100}
              modifiers={[fillMaxWidth()]}
            />
            <Text style={{ typography: "bodySmall" }}>
              中心 {record.baby_center_x}, {record.baby_center_y}
            </Text>
          </Column>
          <Column
            modifiers={[weight(1)]}
            horizontalAlignment="end"
            verticalArrangement={{ spacedBy: 6 }}
          >
            <Text style={{ typography: "bodySmall" }}>人脸画面占比</Text>
            <Text style={{ typography: "headlineSmall", fontWeight: "700" }}>
              {record.face_ratio}%
            </Text>
            <LinearProgressIndicator
              progress={record.face_ratio / 100}
              modifiers={[fillMaxWidth()]}
            />
            <Text style={{ typography: "bodySmall" }}>
              中心 {record.face_center_x}, {record.face_center_y}
            </Text>
          </Column>
        </Row>
      </Column>
    </Card>
  );
}

export function HistoryScreen({ onOpenSettings }: HistoryScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const viewModel = useMonitoringHistoryViewModel();
  const { user } = useAuthViewModel();
  const { accentSeed } = useSettingsViewModel();
  const recordGroups = groupRecords(viewModel.records);

  return (
    <Host style={{ flex: 1 }} seedColor={accentSeed} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column modifiers={[fillMaxSize()]}>
          <Column modifiers={[fillMaxWidth(), padding(20, 20, 20, 12)]}>
            <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
              <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
                监测历史
              </Text>
              <Spacer modifiers={[weight(1)]} />
              <FilledTonalIconButton onClick={onOpenSettings}>
                <Icon
                  source={require("../assets/settings.xml")}
                  size={24}
                  contentDescription="设置"
                />
              </FilledTonalIconButton>
            </Row>
            <Text style={{ typography: "bodyMedium" }}>
              {viewModel.total > 0
                ? `${user?.email ?? "当前用户"} · 共 ${viewModel.total} 条设备记录`
                : "设备记录会显示在这里"}
            </Text>
          </Column>

          {viewModel.isLoading ? (
            <Column
              modifiers={[fillMaxSize()]}
              horizontalAlignment="center"
              verticalArrangement="center"
            >
              <CircularWavyProgressIndicator />
              <Text>正在读取记录…</Text>
            </Column>
          ) : viewModel.error && viewModel.records.length === 0 ? (
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
          ) : viewModel.records.length === 0 ? (
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
                  contentDescription="暂无监测记录"
                />
                <Text style={{ typography: "headlineSmall" }}>暂无监测记录</Text>
                <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                  设备上传第一条数据后，在此下拉即可刷新。
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
                contentPadding={{ start: 16, top: 8, end: 16, bottom: 24 }}
                verticalArrangement={{ spacedBy: 12 }}
              >
                <Card modifiers={[fillMaxWidth()]} elevation={0}>
                  <Column
                    modifiers={[paddingAll(16)]}
                    verticalArrangement={{ spacedBy: 10 }}
                  >
                    <Text style={{ typography: "titleMedium", fontWeight: "600" }}>
                      记录概览
                    </Text>
                    <Row horizontalArrangement="spaceBetween">
                      <Column>
                        <Text style={{ typography: "bodySmall" }}>全部记录</Text>
                        <Text
                          style={{ typography: "headlineSmall", fontWeight: "700" }}
                        >
                          {viewModel.total}
                        </Text>
                      </Column>
                      <Column horizontalAlignment="center">
                        <Text style={{ typography: "bodySmall" }}>当前载入</Text>
                        <Text
                          style={{ typography: "headlineSmall", fontWeight: "700" }}
                        >
                          {viewModel.records.length}
                        </Text>
                      </Column>
                      <Column horizontalAlignment="end">
                        <Text style={{ typography: "bodySmall" }}>载入报警</Text>
                        <Text
                          color={isDark ? "#FFB4AB" : "#BA1A1A"}
                          style={{ typography: "headlineSmall", fontWeight: "700" }}
                        >
                          {viewModel.loadedAlarmCount}
                        </Text>
                      </Column>
                    </Row>
                  </Column>
                </Card>
                {viewModel.error ? (
                  <Card modifiers={[fillMaxWidth()]} elevation={0}>
                    <Column
                      modifiers={[paddingAll(14)]}
                      verticalArrangement={{ spacedBy: 6 }}
                    >
                      <Text color={isDark ? "#FFB4AB" : "#BA1A1A"}>
                        {viewModel.error}
                      </Text>
                      <TextButton onClick={() => void viewModel.retry()}>
                        <Text>重新加载</Text>
                      </TextButton>
                    </Column>
                  </Card>
                ) : null}
                {recordGroups.flatMap((group) => [
                  <Text
                    key={`day-${group.key}`}
                    style={{ typography: "titleSmall", fontWeight: "700" }}
                  >
                    {group.label}
                  </Text>,
                  ...group.records.map((record) => (
                    <RecordCard key={record.id} record={record} isDark={isDark} />
                  ))
                ])}
                {viewModel.hasMore ? (
                  <Column verticalArrangement={{ spacedBy: 4 }}>
                    {viewModel.loadMoreError ? (
                      <Text
                        color={isDark ? "#FFB4AB" : "#BA1A1A"}
                        style={{ typography: "bodySmall", textAlign: "center" }}
                      >
                        {viewModel.loadMoreError}
                      </Text>
                    ) : null}
                    <FilledTonalButton
                      enabled={!viewModel.isLoadingMore}
                      onClick={() => void viewModel.loadMore()}
                      modifiers={[fillMaxWidth()]}
                    >
                      <Text>
                        {viewModel.isLoadingMore
                          ? "正在加载…"
                          : viewModel.loadMoreError
                            ? "重试加载更多"
                            : "加载更多"}
                      </Text>
                    </FilledTonalButton>
                  </Column>
                ) : (
                  <Text style={{ typography: "bodySmall", textAlign: "center" }}>
                    已显示全部 {viewModel.records.length} 条记录
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
