import type { ColorSchemeName, NativeSyntheticEvent, ViewProps } from "react-native";
import { StyleSheet } from "react-native";
import { Host, useMaterialColors } from "@expo/ui/jetpack-compose";
import { requireNativeView } from "expo";

import type { SavedMonitoringReport } from "../models/types";
import { formatDateRange } from "../ui/theme";

type SwipeableReportCardProps = {
  savedReport: SavedMonitoringReport;
  accentSeed: string | undefined;
  colorScheme: ColorSchemeName;
  onOpen: () => void;
  onDelete: () => void;
  onShare: () => void;
};

type EmptyNativeEvent = NativeSyntheticEvent<Record<string, never>>;

type NativeSavedReportCardProps = ViewProps & {
  cacheKey: string;
  label: string;
  dateRange: string;
  metadata: string;
  darkTheme: boolean;
  primaryColor: string;
  onPrimaryColor: string;
  surfaceColor: string;
  surfaceContainerLowColor: string;
  onSurfaceColor: string;
  onSurfaceVariantColor: string;
  surfaceTintColor: string;
  errorColor: string;
  onErrorColor: string;
  secondaryContainerColor: string;
  onSecondaryContainerColor: string;
  onOpen: (event: EmptyNativeEvent) => void;
  onDelete: (event: EmptyNativeEvent) => void;
  onShare: (event: EmptyNativeEvent) => void;
};

const NativeSavedReportCard: React.ComponentType<NativeSavedReportCardProps> =
  requireNativeView("SensorAyaCompose", "SavedReportCard");

const reportLabels = {
  session: "单次分析",
  daily: "日报",
  weekly: "周报",
  monthly: "月报"
} as const;

const savedAtFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function SwipeableReportCard({
  savedReport,
  accentSeed,
  colorScheme,
  onOpen,
  onDelete,
  onShare
}: SwipeableReportCardProps) {
  const colors = useMaterialColors({ colorScheme, seedColor: accentSeed });

  return (
    <Host
      style={styles.card}
      seedColor={accentSeed}
      colorScheme={colorScheme}
    >
      <NativeSavedReportCard
        style={styles.fill}
        cacheKey={savedReport.cacheKey}
        label={reportLabels[savedReport.report.period]}
        dateRange={formatDateRange(
          savedReport.report.start_at,
          savedReport.report.end_at
        )}
        metadata={`${savedReport.report.sample_count} 条样本 · 保存于 ${savedAtFormatter.format(new Date(savedReport.savedAt))}`}
        darkTheme={colorScheme === "dark"}
        primaryColor={colors.primary}
        onPrimaryColor={colors.onPrimary}
        surfaceColor={colors.surface}
        surfaceContainerLowColor={colors.surfaceContainerLow}
        onSurfaceColor={colors.onSurface}
        onSurfaceVariantColor={colors.onSurfaceVariant}
        surfaceTintColor={colors.surfaceTint}
        errorColor={colors.error}
        onErrorColor={colors.onError}
        secondaryContainerColor={colors.secondaryContainer}
        onSecondaryContainerColor={colors.onSecondaryContainer}
        onOpen={() => onOpen()}
        onDelete={() => onDelete()}
        onShare={() => onShare()}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 112
  },
  fill: {
    width: "100%",
    height: "100%"
  }
});
