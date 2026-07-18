import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import {
  Button,
  CircularWavyProgressIndicator,
  Column,
  Host,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import { BRAND_SEED, formatDateRange } from "../ui/theme";
import { ReportMarkdown } from "../ui/ReportMarkdown";
import { useReportViewModel } from "../viewmodels/useReportViewModel";

export function ReportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const viewModel = useReportViewModel();

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#141218" : "#FFFBFE" }]}>
      <Host matchContents seedColor={BRAND_SEED} colorScheme={colorScheme}>
        <Surface modifiers={[fillMaxWidth()]}>
          <Column modifiers={[padding(20, 20, 20, 16)]} verticalArrangement={{ spacedBy: 14 }}>
            <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
              智能报告
            </Text>
            <Text style={{ typography: "bodyMedium" }}>
              根据近期监测数据生成严谨的中文分析。
            </Text>
            <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
              <SegmentedButton
                selected={viewModel.period === "weekly"}
                onClick={() => viewModel.setPeriod("weekly")}
              >
                <SegmentedButton.Label>
                  <Text>周报 · 7 天</Text>
                </SegmentedButton.Label>
              </SegmentedButton>
              <SegmentedButton
                selected={viewModel.period === "monthly"}
                onClick={() => viewModel.setPeriod("monthly")}
              >
                <SegmentedButton.Label>
                  <Text>月报 · 30 天</Text>
                </SegmentedButton.Label>
              </SegmentedButton>
            </SingleChoiceSegmentedButtonRow>
            <Button
              enabled={!viewModel.isGenerating}
              onClick={() => void viewModel.generate()}
              modifiers={[fillMaxWidth()]}
            >
              <Text>{viewModel.isGenerating ? "正在分析监测数据…" : "生成报告"}</Text>
            </Button>
            {viewModel.isGenerating ? <CircularWavyProgressIndicator /> : null}
            {viewModel.error ? (
              <Text color="#BA1A1A" style={{ typography: "bodyMedium" }}>
                {viewModel.error}
              </Text>
            ) : null}
            {viewModel.report ? (
              <Text style={{ typography: "labelLarge" }}>
                {formatDateRange(viewModel.report.start_at, viewModel.report.end_at)} · {viewModel.report.sample_count} 条样本
              </Text>
            ) : null}
          </Column>
        </Surface>
      </Host>

      {viewModel.report ? (
        <ScrollView contentContainerStyle={styles.report}>
          <ReportMarkdown markdown={viewModel.report.report} isDark={isDark} />
        </ScrollView>
      ) : (
        <View style={styles.placeholder}>
          <Host matchContents seedColor={BRAND_SEED} colorScheme={colorScheme}>
            <Column horizontalAlignment="center" modifiers={[paddingAll(24)]}>
              <Text style={{ typography: "headlineSmall" }}>选择报告周期</Text>
              <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                报告会先评估数据质量，再分析可见度、报警与画面稳定性。
              </Text>
            </Column>
          </Host>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  report: { paddingHorizontal: 20, paddingBottom: 32 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" }
});
