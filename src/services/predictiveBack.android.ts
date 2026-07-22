import { requireNativeModule } from "expo";

export type PredictiveBackEvent = {
  phase: "started" | "progressed" | "cancelled" | "committed";
  progress: number;
  edge: "left" | "right";
};

type EventSubscription = { remove: () => void };

type PredictiveBackNativeModule = {
  addListener: (
    eventName: "onPredictiveBack",
    listener: (event: PredictiveBackEvent) => void
  ) => EventSubscription;
  isPredictiveBackAvailable?: () => boolean;
  setPredictiveBackEnabled?: (enabled: boolean) => Promise<void>;
};

export const predictiveBack =
  requireNativeModule<PredictiveBackNativeModule>("SensorAyaCompose");
