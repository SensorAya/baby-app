# SensorAya Baby App

面向 Android 用户设备的 Expo / React Native 应用。Android View 使用 Expo UI 提供的原生 Jetpack Compose Material 3 组件，业务代码采用 MVVM 分层。

## 功能

- 使用永久 Bearer Token 登录，凭证由 `expo-secure-store` 加密保存
- 分页查看当前用户的 monitoring 历史，支持下拉刷新
- 生成 7 天周报或 30 天月报，并阅读 Markdown 报告
- Material You 配色、系统浅色/深色模式和边到边布局

## 配置

复制 `.env.example` 为 `.env`：

```dotenv
URL=http://10.0.2.2:8000
TOKEN=user_development_token
```

`URL` 会写入 App 的运行时配置。`TOKEN` 只供 `verify:backend` 开发验证使用，不会被打包进 APK，也不会预填到登录页面。

真机不能用 `localhost` 访问电脑上的后端，请改用电脑局域网地址或可访问的服务器地址。

## 开发与验证

```bash
npm install
npm run typecheck
npm run android
npm run verify:backend
VERIFY_REPORT=1 npm run verify:backend
```

## MVVM 目录

```text
src/models       API 数据模型
src/services     HTTP 与安全存储
src/viewmodels   鉴权、历史、报告状态和命令
src/views        Android Compose Material 3 View
src/ui           主题与显示格式
```

## 构建 APK

```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

生成文件位于 `android/app/build/outputs/apk/release/app-release.apk`。
