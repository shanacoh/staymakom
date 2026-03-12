import * as amplitude from "@amplitude/analytics-browser";
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser";

let initialized = false;

export function initAmplitude() {
  if (initialized) return;

  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  const sessionReplay = sessionReplayPlugin({
    sampleRate: 0.3,
    privacyConfig: {
      maskSelector: [
        'input[type="email"]',
        'input[type="tel"]',
        'input[name="firstName"]',
        'input[name="lastName"]',
        'input[name="city"]',
        'input[name="cardNumber"]',
        'input[name="cvv"]',
        'input[type="password"]',
        ".pii-field",
      ],
    },
  });

  amplitude.add(sessionReplay);
  amplitude.init(apiKey, {
    autocapture: false,
    defaultTracking: {
      sessions: true,
      pageViews: false,
      formInteractions: false,
      fileDownloads: false,
    },
  });

  initialized = true;
}

export function isAmplitudeReady(): boolean {
  return initialized;
}

export function safeTrack(eventName: string, properties?: Record<string, any>) {
  if (!initialized) return;
  amplitude.track(eventName, properties);
}

export function safeIdentify(userId: string, properties?: Record<string, any>) {
  if (!initialized) return;
  amplitude.setUserId(userId);
  if (properties) {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    amplitude.identify(identify);
  }
}

export function safeSetUserProperty(key: string, value: any) {
  if (!initialized) return;
  const identify = new amplitude.Identify();
  identify.set(key, value);
  amplitude.identify(identify);
}
