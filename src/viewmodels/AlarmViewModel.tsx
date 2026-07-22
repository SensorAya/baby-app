import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { Platform, Vibration } from "react-native";

import type { AlarmEvent, AlarmStreamMessage } from "../models/types";
import { api, createAlarmWebSocket } from "../services/api";
import { useAuthViewModel } from "./AuthViewModel";

const ALARM_CHANNEL = "sensoraya-alarm";
const ALARM_CATEGORY = "sensoraya-alarm-actions";
const DISMISS_ACTION = "dismiss-alarm";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

type AlarmViewModel = {
  active: boolean;
  dismissed: boolean;
  alarm: AlarmEvent | null;
  dismiss: () => void;
};

const AlarmContext = createContext<AlarmViewModel | null>(null);

export function AlarmViewModelProvider({ children }: PropsWithChildren) {
  const { token } = useAuthViewModel();
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [alarm, setAlarm] = useState<AlarmEvent | null>(null);
  const notificationId = useRef<string | null>(null);
  const currentAlarmId = useRef<string | null>(null);
  const alertedAlarmId = useRef<string | null>(null);
  const dismissedAlarmId = useRef<string | null>(null);

  const stopAlert = useCallback(() => {
    Vibration.cancel();
    const currentNotificationId = notificationId.current;
    notificationId.current = null;
    if (currentNotificationId) {
      void Notifications.dismissNotificationAsync(currentNotificationId);
    }
  }, []);

  const dismiss = useCallback(() => {
    dismissedAlarmId.current = currentAlarmId.current;
    setDismissed(true);
    stopAlert();
  }, [stopAlert]);

  const showAlert = useCallback(async (nextAlarm: AlarmEvent) => {
    Vibration.cancel();
    Vibration.vibrate([0, 900, 450], true);
    try {
      const scheduledId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "SensorAya 婴儿监控报警",
          body: `人脸 ${nextAlarm.face_ratio}% · 宝宝 ${nextAlarm.baby_ratio}%`,
          data: { alarmId: nextAlarm.id },
          sound: "default",
          vibrate: [0, 900, 450, 900],
          priority: "max",
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: ALARM_CATEGORY
        },
        trigger: Platform.OS === "android" ? { channelId: ALARM_CHANNEL } : null
      });
      if (
        currentAlarmId.current === nextAlarm.id &&
        dismissedAlarmId.current !== nextAlarm.id
      ) {
        notificationId.current = scheduledId;
      } else {
        await Notifications.dismissNotificationAsync(scheduledId);
      }
    } catch {
      // The in-app banner and vibration remain available if permission is denied.
    }
  }, []);

  const applyState = useCallback(
    (nextActive: boolean, nextAlarm: AlarmEvent | null) => {
      setActive(nextActive);
      setAlarm(nextAlarm);
      currentAlarmId.current = nextAlarm?.id ?? null;
      if (!nextActive || !nextAlarm) {
        setDismissed(false);
        alertedAlarmId.current = null;
        dismissedAlarmId.current = null;
        stopAlert();
        return;
      }
      const wasDismissed = dismissedAlarmId.current === nextAlarm.id;
      setDismissed(wasDismissed);
      if (!wasDismissed && alertedAlarmId.current !== nextAlarm.id) {
        alertedAlarmId.current = nextAlarm.id;
        stopAlert();
        void showAlert(nextAlarm);
      }
    },
    [showAlert, stopAlert]
  );

  useEffect(() => {
    void (async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(ALARM_CHANNEL, {
          name: "婴儿监控报警",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 900, 450, 900],
          enableVibrate: true,
          sound: "default"
        });
      }
      await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY, [
        {
          identifier: DISMISS_ACTION,
          buttonTitle: "停止震动",
          options: { opensAppToForeground: true }
        }
      ]);
      await Notifications.requestPermissionsAsync();
    })();
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (
          response.actionIdentifier === DISMISS_ACTION ||
          response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ) {
          dismiss();
        }
      }
    );
    return () => subscription.remove();
  }, [dismiss]);

  useEffect(() => {
    if (!token) return;
    let disposed = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;

    const connect = () => {
      if (disposed) return;
      socket = createAlarmWebSocket(token);
      socket.onopen = () => {
        retryDelay = 1000;
      };
      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(String(message.data)) as
            | AlarmStreamMessage
            | { type: "ping" };
          if (payload.type !== "ping") applyState(payload.active, payload.alarm);
        } catch {
          // Ignore malformed frames and keep the authenticated connection alive.
        }
      };
      socket.onclose = () => {
        if (disposed) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      };
    };

    void (async () => {
      try {
        const state = await api.getActiveAlarm(token);
        if (!disposed) applyState(state.active, state.alarm);
      } catch {
        // The WebSocket's initial state remains the authoritative fallback.
      }
      connect();
    })();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
      stopAlert();
    };
  }, [applyState, stopAlert, token]);

  const value = useMemo(
    () => ({ active, dismissed, alarm, dismiss }),
    [active, alarm, dismiss, dismissed]
  );
  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>;
}

export function useAlarmViewModel(): AlarmViewModel {
  const context = useContext(AlarmContext);
  if (!context) throw new Error("useAlarmViewModel requires AlarmViewModelProvider");
  return context;
}
