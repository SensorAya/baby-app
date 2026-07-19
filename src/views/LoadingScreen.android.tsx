import { useColorScheme } from "react-native";
import {
  Button,
  CircularWavyProgressIndicator,
  Column,
  Host,
  Surface,
  Text,
  TextButton
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";

type LoadingScreenProps = {
  error?: string | null;
  onRetry?: () => void;
  onUseAnotherToken?: () => void;
};

export function LoadingScreen({
  error,
  onRetry,
  onUseAnotherToken
}: LoadingScreenProps) {
  const colorScheme = useColorScheme();
  const { accentSeed } = useSettingsViewModel();
  const failed = Boolean(error);

  return (
    <Host style={{ flex: 1 }} seedColor={accentSeed} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column
          modifiers={[fillMaxSize(), paddingAll(24)]}
          horizontalAlignment="center"
          verticalArrangement="center"
        >
          <Column
            modifiers={[fillMaxWidth()]}
            horizontalAlignment="center"
            verticalArrangement={{ spacedBy: 14 }}
          >
            {failed ? null : <CircularWavyProgressIndicator />}
            <Text
              style={{
                typography: failed ? "headlineSmall" : "bodyLarge",
                fontWeight: failed ? "700" : "400",
                textAlign: "center"
              }}
            >
              {failed ? "暂时无法恢复登录" : "正在安全恢复登录…"}
            </Text>
            {failed ? (
              <>
                <Text style={{ typography: "bodyMedium", textAlign: "center" }}>
                  {error}
                </Text>
                <Text style={{ typography: "bodySmall", textAlign: "center" }}>
                  已保存的永久 Token 仍安全保留在本设备中。
                </Text>
                <Button onClick={onRetry} modifiers={[fillMaxWidth()]}>
                  <Text>重新连接</Text>
                </Button>
                <TextButton onClick={onUseAnotherToken}>
                  <Text>使用其他 Token</Text>
                </TextButton>
              </>
            ) : null}
          </Column>
        </Column>
      </Surface>
    </Host>
  );
}
