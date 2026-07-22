import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import {
  Button,
  CircularWavyProgressIndicator,
  Column,
  FilledTonalButton,
  Host,
  Icon,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import { formatDateRange } from "../ui/theme";
import { ReportMarkdown } from "../ui/ReportMarkdown";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";
import { useReportViewModel } from "../viewmodels/useReportViewModel";

export function ReportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const viewModel = useReportViewModel();
  const { accentSeed } = useSettingsViewModel();

  return (
    <View
      style={[styles.root, { backgroundColor: isDark ? "#141218" : "#FFFBFE" }]}
    >
      <Host
        matchContents={{ vertical: true }}
        style={styles.fullWidth}
        seedColor={accentSeed}
        colorScheme={colorScheme}
      >
        <Surface modifiers={[fillMaxWidth()]}>
          <Column
            modifiers={[padding(20, 20, 20, 16)]}
            verticalArrangement={{ spacedBy: 14 }}
          >
            <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
              智能报告
            </Text>
            <Text style={{ typography: "bodyMedium" }}>
              按完整监测、天、周或月生成严谨的中文分析。
            </Text>
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              <SegmentedButton
                enabled={!viewModel.isGenerating}
                selected={viewModel.period === "session"}
                onClick={() => viewModel.setPeriod("session")}
              >
                <SegmentedButton.Label>
                  <Text>单次</Text>
                </SegmentedButton.Label>
              </SegmentedButton>
              <SegmentedButton
                enabled={!viewModel.isGenerating}
                selected={viewModel.period === "daily"}
                onClick={() => viewModel.setPeriod("daily")}
              >
                <SegmentedButton.Label>
                  <Text>日报</Text>
                </SegmentedButton.Label>
              </SegmentedButton>
            </SingleChoiceSegmentedButtonRow>
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              <SegmentedButton
                enabled={!viewModel.isGenerating}
                selected={viewModel.period === "weekly"}
                onClick={() => viewModel.setPeriod("weekly")}
              >
                <SegmentedButton.Label><Text>周报 · 7 天</Text></SegmentedButton.Label>
              </SegmentedButton>
              <SegmentedButton
                enabled={!viewModel.isGenerating}
                selected={viewModel.period === "monthly"}
                onClick={() => viewModel.setPeriod("monthly")}
              >
                <SegmentedButton.Label><Text>月报 · 30 天</Text></SegmentedButton.Label>
              </SegmentedButton>
            </SingleChoiceSegmentedButtonRow>
            <Button
              enabled={!viewModel.isGenerating}
              onClick={() => void viewModel.generate()}
              modifiers={[fillMaxWidth()]}
            >
              <Text>
                {viewModel.isGenerating
                  ? "正在分析监测数据…"
                  : viewModel.report
                    ? "重新生成报告"
                    : "生成报告"}
              </Text>
            </Button>
            {viewModel.isGenerating ? <CircularWavyProgressIndicator /> : null}
            {viewModel.error ? (
              <Text
                color={isDark ? "#FFB4AB" : "#BA1A1A"}
                style={{ typography: "bodyMedium" }}
              >
                {viewModel.error}
              </Text>
            ) : null}
            {viewModel.report ? (
              <Column verticalArrangement={{ spacedBy: 8 }}>
                <Text style={{ typography: "labelLarge" }}>
                  {formatDateRange(
                    viewModel.report.start_at,
                    viewModel.report.end_at
                  )} · {viewModel.report.sample_count} 条样本
                </Text>
                <FilledTonalButton
                  enabled={!viewModel.isSharing}
                  onClick={() => void viewModel.share()}
                  modifiers={[fillMaxWidth()]}
                >
                  <Text>
                    {viewModel.isSharing ? "正在打开分享面板…" : "分享报告"}
                  </Text>
                </FilledTonalButton>
                {viewModel.shareError ? (
                  <Text
                    color={isDark ? "#FFB4AB" : "#BA1A1A"}
                    style={{ typography: "bodySmall" }}
                  >
                    {viewModel.shareError}
                  </Text>
                ) : null}
              </Column>
            ) : null}
          </Column>
        </Surface>
      </Host>

      {viewModel.report ? (
        <ScrollView contentContainerStyle={styles.report}>
          <ReportMarkdown markdown={viewModel.report.report} isDark={isDark} />
        </ScrollView>
      ) : (
        <Host
          style={styles.placeholderHost}
          seedColor={accentSeed}
          colorScheme={colorScheme}
        >
          <Surface modifiers={[fillMaxSize()]}>
            <Column
              horizontalAlignment="center"
              verticalArrangement="center"
              modifiers={[fillMaxSize(), paddingAll(24)]}
            >
              <Icon
                source={require("../assets/insights.xml")}
                size={48}
                contentDescription="智能报告"
              />
              <Text style={{ typography: "headlineSmall" }}>选择报告周期</Text>
              <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                报告会先评估数据质量，再分析可见度、报警与画面稳定性。
              </Text>
            </Column>
          </Surface>
        </Host>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullWidth: { width: "100%" },
  placeholderHost: { flex: 1, width: "100%" },
  report: { paddingHorizontal: 20, paddingBottom: 32 },
});
