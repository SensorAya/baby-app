import { useColorScheme } from "react-native";
import {
  Card,
  Column,
  FilledIconButton,
  FilledTonalButton,
  Host,
  Icon,
  IconButton,
  LazyColumn,
  LazyRow,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Spacer,
  Surface,
  Text
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
  weight
} from "@expo/ui/jetpack-compose/modifiers";

import type { ThemeMode } from "../services/themeStorage";
import { ACCENT_COLORS } from "../ui/theme";
import { useAuthViewModel } from "../viewmodels/AuthViewModel";
import { useSettingsViewModel } from "../viewmodels/SettingsViewModel";

type SettingsScreenProps = {
  onBack: () => void;
};

const themeOptions: Array<{ mode: ThemeMode; label: string }> = [
  { mode: "system", label: "跟随系统" },
  { mode: "light", label: "浅色" },
  { mode: "dark", label: "深色" }
];

function maskToken(token: string | null): string {
  if (!token) return "未找到已保存的 Token";
  if (token.length <= 8) return "•".repeat(token.length);
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const colorScheme = useColorScheme();
  const { token, signOut } = useAuthViewModel();
  const settings = useSettingsViewModel();
  const selectedAccentLabel =
    ACCENT_COLORS.find((option) => option.id === settings.accentColor)?.label ??
    "系统";

  return (
    <Host
      style={{ flex: 1 }}
      seedColor={settings.accentSeed}
      colorScheme={colorScheme}
    >
      <Surface modifiers={[fillMaxSize()]}>
        <LazyColumn
          modifiers={[fillMaxSize()]}
          contentPadding={{ start: 20, top: 20, end: 20, bottom: 32 }}
          verticalArrangement={{ spacedBy: 16 }}
        >
          <Row
            modifiers={[fillMaxWidth()]}
            verticalAlignment="center"
          >
            <Column>
              <Text style={{ typography: "headlineMedium", fontWeight: "700" }}>
                设置
              </Text>
              <Text style={{ typography: "bodyMedium" }}>
                管理外观与设备登录
              </Text>
            </Column>
            <Spacer modifiers={[weight(1)]} />
            <IconButton onClick={onBack}>
              <Icon
                source={require("../assets/done.xml")}
                size={24}
                contentDescription="完成"
              />
            </IconButton>
          </Row>

          <Card modifiers={[fillMaxWidth()]} elevation={0}>
            <Column
              modifiers={[paddingAll(18)]}
              verticalArrangement={{ spacedBy: 14 }}
            >
              <Column verticalArrangement={{ spacedBy: 4 }}>
                <Text style={{ typography: "titleLarge", fontWeight: "600" }}>
                  外观
                </Text>
                <Text style={{ typography: "bodyMedium" }}>
                  选择应用使用的显示模式。
                </Text>
              </Column>
              <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                {themeOptions.map((option) => (
                  <SegmentedButton
                    key={option.mode}
                    selected={settings.themeMode === option.mode}
                    onClick={() => void settings.setThemeMode(option.mode)}
                  >
                    <SegmentedButton.Label>
                      <Text>{option.label}</Text>
                    </SegmentedButton.Label>
                  </SegmentedButton>
                ))}
              </SingleChoiceSegmentedButtonRow>
              <Column verticalArrangement={{ spacedBy: 10 }}>
                <Row modifiers={[fillMaxWidth()]} verticalAlignment="center">
                  <Text style={{ typography: "labelLarge", fontWeight: "600" }}>
                    强调色
                  </Text>
                  <Spacer modifiers={[weight(1)]} />
                  <Text style={{ typography: "bodySmall" }}>
                    {selectedAccentLabel} · 左右滑动
                  </Text>
                </Row>
                <LazyRow
                  modifiers={[fillMaxWidth()]}
                  horizontalArrangement={{ spacedBy: 10 }}
                  verticalAlignment="center"
                >
                  {ACCENT_COLORS.map((option) => {
                    const selected = settings.accentColor === option.id;
                    return (
                      <FilledIconButton
                        key={option.id}
                        onClick={() =>
                          void settings.setAccentColor(option.id)
                        }
                        colors={{
                          ...(option.seed
                            ? {
                                containerColor: option.seed,
                                contentColor: "#FFFFFF"
                              }
                            : {})
                        }}
                      >
                        <Icon
                          source={
                            selected
                              ? require("../assets/done.xml")
                              : option.id === "system"
                                ? require("../assets/palette.xml")
                                : require("../assets/done.xml")
                          }
                          size={20}
                          tint={
                            option.id === "system"
                              ? undefined
                              : selected
                                ? "#FFFFFF"
                                : "#00000000"
                          }
                          contentDescription={
                            selected
                              ? `已选择${option.label}`
                              : `选择${option.label}`
                          }
                        />
                      </FilledIconButton>
                    );
                  })}
                </LazyRow>
              </Column>
              {settings.error ? (
                <Text
                  color={colorScheme === "dark" ? "#FFB4AB" : "#BA1A1A"}
                  style={{ typography: "bodySmall" }}
                >
                  {settings.error}
                </Text>
              ) : null}
            </Column>
          </Card>

          <Card modifiers={[fillMaxWidth()]} elevation={0}>
            <Column
              modifiers={[paddingAll(18)]}
              verticalArrangement={{ spacedBy: 12 }}
            >
              <Column verticalArrangement={{ spacedBy: 4 }}>
                <Text style={{ typography: "titleLarge", fontWeight: "600" }}>
                  登录与账户
                </Text>
                <Text style={{ typography: "bodySmall" }}>当前登录</Text>
                <Text style={{ typography: "titleMedium" }}>
                  {maskToken(token)}
                </Text>
              </Column>
              <Text style={{ typography: "bodyMedium" }}>
                永久 Token 已加密保存在本设备中，完整内容不会在界面中显示。
              </Text>
              <FilledTonalButton
                modifiers={[fillMaxWidth()]}
                onClick={() => void signOut()}
              >
                <Text>更换登录 Token</Text>
              </FilledTonalButton>
            </Column>
          </Card>

          <Card modifiers={[fillMaxWidth()]} elevation={0}>
            <Row
              modifiers={[paddingAll(18)]}
              horizontalArrangement={{ spacedBy: 14 }}
              verticalAlignment="center"
            >
              <Icon
                source={require("../../assets/brand-icon.png")}
                size={48}
                tint={null}
                contentDescription="SensorAya Baby"
              />
              <Column verticalArrangement={{ spacedBy: 6 }}>
                <Text style={{ typography: "titleMedium", fontWeight: "600" }}>
                  关于 SensorAya Baby
                </Text>
                <Text style={{ typography: "bodyMedium" }}>
                  用于查看设备监测历史，并依据近期记录生成智能报告。
                </Text>
              </Column>
            </Row>
          </Card>
        </LazyColumn>
      </Surface>
    </Host>
  );
}
