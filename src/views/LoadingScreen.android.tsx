import { useColorScheme } from "react-native";
import {
  CircularWavyProgressIndicator,
  Column,
  Host,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import { BRAND_SEED } from "../ui/theme";

export function LoadingScreen() {
  const colorScheme = useColorScheme();
  return (
    <Host style={{ flex: 1 }} seedColor={BRAND_SEED} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column
          modifiers={[fillMaxSize(), paddingAll(24)]}
          horizontalAlignment="center"
          verticalArrangement="center"
        >
          <CircularWavyProgressIndicator />
          <Text style={{ typography: "bodyLarge" }}>正在安全恢复登录…</Text>
        </Column>
      </Surface>
    </Host>
  );
}
