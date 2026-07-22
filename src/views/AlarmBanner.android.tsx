import { StyleSheet, useColorScheme, View } from "react-native";
import { Card, Column, FilledTonalButton, Host, Row, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll, weight } from "@expo/ui/jetpack-compose/modifiers";

import type { AlarmEvent } from "../models/types";
import { formatRecordTime } from "../ui/theme";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";

export function AlarmBanner({ alarm, onDismiss }: { alarm: AlarmEvent; onDismiss: () => void }) {
  const colorScheme = useColorScheme();
  const { accentSeed } = useSettingsViewModel();
  return (
    <View style={styles.overlay}>
      <Host matchContents={{ vertical: true }} style={styles.host} seedColor={accentSeed} colorScheme={colorScheme}>
        <Card modifiers={[fillMaxWidth()]} elevation={8}>
          <Column modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 10 }}>
            <Text color="#BA1A1A" style={{ typography: "titleLarge", fontWeight: "800" }}>监控报警</Text>
            <Text style={{ typography: "bodyMedium" }}>
              {formatRecordTime(alarm.timestamp)} · 人脸 {alarm.face_ratio}% · 宝宝 {alarm.baby_ratio}%
            </Text>
            <Row modifiers={[fillMaxWidth()]}>
              <Column modifiers={[weight(1)]}>
                <Text style={{ typography: "bodySmall" }}>请立即核验现场；点击后停止本机持续震动。</Text>
              </Column>
              <FilledTonalButton onClick={onDismiss}><Text>Dismiss</Text></FilledTonalButton>
            </Row>
          </Column>
        </Card>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 12, left: 12, right: 12, zIndex: 20 },
  host: { width: "100%" }
});
