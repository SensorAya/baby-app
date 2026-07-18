import { useState } from "react";
import { useColorScheme } from "react-native";
import {
  Button,
  Card,
  Column,
  Host,
  OutlinedTextField,
  Shape,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import { BRAND_SEED } from "../ui/theme";
import { useAuthViewModel } from "../viewmodels/AuthViewModel";

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const { status, error, signIn, clearError } = useAuthViewModel();
  const [token, setToken] = useState("");
  const isBusy = status === "verifying";

  const submit = () => {
    void signIn(token);
  };

  return (
    <Host style={{ flex: 1 }} seedColor={BRAND_SEED} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <Column
          modifiers={[fillMaxSize(), padding(24, 48, 24, 32)]}
          verticalArrangement="center"
        >
          <Text style={{ typography: "displaySmall", fontWeight: "700" }}>
            SensorAya
          </Text>
          <Text style={{ typography: "titleMedium" }}>安心看护，从每一次记录开始</Text>

          <Card modifiers={[fillMaxWidth(), paddingAll(20)]} elevation={1}>
            <Column verticalArrangement={{ spacedBy: 16 }}>
              <Text style={{ typography: "headlineSmall", fontWeight: "600" }}>
                设备登录
              </Text>
              <Text style={{ typography: "bodyMedium" }}>
                输入管理员提供的永久 Token。凭证会加密保存在本设备中。
              </Text>
              <OutlinedTextField
                singleLine
                visualTransformation="password"
                maxLength={256}
                enabled={!isBusy}
                isError={Boolean(error)}
                onValueChange={(value) => {
                  setToken(value);
                  if (error) clearError();
                }}
                keyboardOptions={{
                  autoCorrectEnabled: false,
                  capitalization: "none",
                  keyboardType: "password",
                  imeAction: "done"
                }}
                keyboardActions={{ onDone: submit }}
                modifiers={[fillMaxWidth()]}
                shape={Shape.RoundedCorner({
                  cornerRadii: {
                    topStart: 12,
                    topEnd: 12,
                    bottomStart: 12,
                    bottomEnd: 12
                  }
                })}
              >
                <OutlinedTextField.Label>永久 Token</OutlinedTextField.Label>
                <OutlinedTextField.Placeholder>user_••••••••</OutlinedTextField.Placeholder>
                {error ? (
                  <OutlinedTextField.SupportingText>{error}</OutlinedTextField.SupportingText>
                ) : null}
              </OutlinedTextField>
              <Button
                onClick={submit}
                enabled={!isBusy && token.trim().length > 0}
                modifiers={[fillMaxWidth()]}
              >
                {isBusy ? "正在验证…" : "安全登录"}
              </Button>
            </Column>
          </Card>

          <Text
            modifiers={[paddingAll(8)]}
            style={{ typography: "bodySmall", textAlign: "center" }}
          >
            Token 仅用于连接你的 SensorAya 后端，不会发送到其他服务。
          </Text>
        </Column>
      </Surface>
    </Host>
  );
}
