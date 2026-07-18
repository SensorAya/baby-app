import { useColorScheme } from "react-native";
import {
  Button,
  Card,
  CircularWavyProgressIndicator,
  Column,
  FilledTonalButton,
  Host,
  LazyColumn,
  PullToRefreshBox,
  Row,
  Surface,
  Text,
  TextButton
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import type { MonitoringRecord } from "../models/types";
import { BRAND_SEED, formatRecordTime } from "../ui/theme";
import { useAuthViewModel } from "../viewmodels/AuthViewModel";
import { useMonitoringHistoryViewModel } from "../viewmodels/useMonitoringHistoryViewModel";

function RecordCard({ record }: { record: MonitoringRecord }) {
  return (
    <Card modifiers={[fillMaxWidth(), paddingAll(16)]} elevation={record.alarm_active ? 2 : 0}>
      <Column verticalArrangement={{ spacedBy: 8 }}>
        <Row horizontalArrangement="spaceBetween" verticalAlignment="center">
          <Column>
            <Text style={{ typography: "titleMedium", fontWeight: "600" }}>
              {formatRecordTime(record.timestamp)}
            </Text>
            <Text style={{ typography: "bodySmall" }}>记录 #{record.id.slice(0, 8)}</Text>
          </Column>
          <Text
            color={record.alarm_active ? "#BA1A1A" : "#2E7D32"}
            style={{ typography: "labelLarge", fontWeight: "700" }}
          >
            {record.alarm_active ? "● 报警" : "● 正常"}
          </Text>
        </Row>
        <Row horizontalArrangement="spaceBetween">
          <Column>
            <Text style={{ typography: "bodySmall" }}>人脸可见度</Text>
            <Text style={{ typography: "headlineSmall", fontWeight: "700" }}>
              {record.face_ratio}%
            </Text>
          </Column>
          <Column horizontalAlignment="end">
            <Text style={{ typography: "bodySmall" }}>画面中心</Text>
            <Text style={{ typography: "titleMedium" }}>
              {record.face_center_x}, {record.face_center_y}
            </Text>
          </Column>
        </Row>
      </Column>
    </Card>
  );
}

export function HistoryScreen() {
  const colorScheme = useColorScheme();
  const viewModel = useMonitoringHistoryViewModel();
  const { user, signOut } = useAuthViewModel();

  return (
    <Host style={{ flex: 1 }} seedColor={BRAND_SEED} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column modifiers={[fillMaxSize()]}>
          <Column modifiers={[padding(20, 20, 20, 12)]}>
            <Row horizontalArrangement="spaceBetween" verticalAlignment="center">
              <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
                监测历史
              </Text>
              <TextButton onClick={() => void signOut()}>
                <Text>退出登录</Text>
              </TextButton>
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
          ) : viewModel.error ? (
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
            <Column
              modifiers={[fillMaxSize(), paddingAll(24)]}
              horizontalAlignment="center"
              verticalArrangement="center"
            >
              <Text style={{ typography: "headlineSmall" }}>暂无监测记录</Text>
              <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                设备上传第一条数据后，在此下拉即可刷新。
              </Text>
            </Column>
          ) : (
            <PullToRefreshBox
              isRefreshing={viewModel.isRefreshing}
              onRefresh={() => void viewModel.refresh()}
              modifiers={[fillMaxSize()]}
            >
              <LazyColumn
                modifiers={[fillMaxSize()]}
                contentPadding={{ start: 16, top: 8, end: 16, bottom: 24 }}
                verticalArrangement={{ spacedBy: 12 }}
              >
                {viewModel.records.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
                {viewModel.hasMore ? (
                  <FilledTonalButton
                    enabled={!viewModel.isLoadingMore}
                    onClick={() => void viewModel.loadMore()}
                    modifiers={[fillMaxWidth()]}
                  >
                    <Text>{viewModel.isLoadingMore ? "正在加载…" : "加载更多"}</Text>
                  </FilledTonalButton>
                ) : null}
              </LazyColumn>
            </PullToRefreshBox>
          )}
        </Column>
      </Surface>
    </Host>
  );
}
