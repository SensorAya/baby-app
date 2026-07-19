import { useState } from "react";
import { useColorScheme } from "react-native";
import {
  Button,
  Column,
  Host,
  Icon,
  LazyColumn,
  OutlinedTextField,
  Row,
  Shape,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  imePadding,
  paddingAll
} from "@expo/ui/jetpack-compose/modifiers";

import { useAuthViewModel } from "../viewmodels/AuthViewModel";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";

export function LoginScreen() {
  const colorScheme = useColorScheme();
  const { status, error, signIn, clearError } = useAuthViewModel();
  const { accentSeed } = useSettingsViewModel();
  const [token, setToken] = useState("");
  const isBusy = status === "verifying";

  const submit = () => {
    void signIn(token);
  };

  return (
    <Host style={{ flex: 1 }} seedColor={accentSeed} colorScheme={colorScheme}>
      <Surface modifiers={[fillMaxSize()]}>
        <LazyColumn
          modifiers={[fillMaxSize(), imePadding()]}
          horizontalAlignment="center"
          verticalArrangement="center"
          contentPadding={{ start: 24, top: 32, end: 24, bottom: 40 }}
        >
          <Column
            modifiers={[fillMaxWidth()]}
            horizontalAlignment="center"
            verticalArrangement={{ spacedBy: 24 }}
          >
            <Icon
              source={require("../../assets/brand-icon.png")}
              size={72}
              tint={null}
              contentDescription="SensorAya Baby"
            />
            <Column
              horizontalAlignment="center"
              verticalArrangement={{ spacedBy: 8 }}
            >
              <Text
                style={{
                  typography: "titleMedium",
                  fontWeight: "600",
                  letterSpacing: 0.6
                }}
              >
                SensorAya Baby
              </Text>
              <Text
                style={{
                  typography: "headlineMedium",
                  fontWeight: "700",
                  textAlign: "center"
                }}
              >
                连接看护设备
              </Text>
              <Text
                style={{
                  typography: "bodyLarge",
                  textAlign: "center",
                  lineHeight: 24
                }}
              >
                使用管理员提供的永久 Token 登录
              </Text>
            </Column>

            <Column
              modifiers={[fillMaxWidth()]}
              verticalArrangement={{ spacedBy: 14 }}
            >
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
                <OutlinedTextField.LeadingIcon>
                  <Icon
                    source={require("../assets/lock.xml")}
                    size={20}
                    contentDescription="永久 Token"
                  />
                </OutlinedTextField.LeadingIcon>
                <OutlinedTextField.Label>
                  <Text>永久 Token</Text>
                </OutlinedTextField.Label>
                <OutlinedTextField.Placeholder>
                  <Text>粘贴永久 Token</Text>
                </OutlinedTextField.Placeholder>
                {error ? (
                  <OutlinedTextField.SupportingText>
                    <Text>{error}</Text>
                  </OutlinedTextField.SupportingText>
                ) : null}
              </OutlinedTextField>
              <Button
                onClick={submit}
                enabled={!isBusy && token.trim().length > 0}
                modifiers={[fillMaxWidth()]}
              >
                <Text>{isBusy ? "正在验证…" : "验证并登录"}</Text>
              </Button>
            </Column>

            <Surface
              tonalElevation={1}
              shape={Shape.RoundedCorner({
                cornerRadii: {
                  topStart: 20,
                  topEnd: 20,
                  bottomStart: 20,
                  bottomEnd: 20
                }
              })}
              modifiers={[fillMaxWidth()]}
            >
              <Row
                modifiers={[paddingAll(14)]}
                verticalAlignment="center"
                horizontalArrangement={{ spacedBy: 10 }}
              >
                <Icon
                  source={require("../assets/lock.xml")}
                  size={18}
                  contentDescription="安全存储"
                />
                <Text style={{ typography: "bodySmall" }}>
                  Token 仅保存在本设备，登录后只显示脱敏内容。
                </Text>
              </Row>
            </Surface>
          </Column>
        </LazyColumn>
      </Surface>
    </Host>
  );
}
