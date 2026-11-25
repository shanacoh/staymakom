import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as amplitude from '@amplitude/unified';
import { initGlobalErrorTracking } from "./lib/errorTracking";

import { isUntrackedPath, markTrackingStarted, shouldStartTracking } from "./lib/trackingGuard";

// Amplitude (et Session Replay) ne démarre que pour un vrai visiteur sur www.staymakom.com :
// ni robot, ni localhost / preview Vercel, ni visite de test (voir src/lib/trackingGuard.ts).
if (shouldStartTracking()) {
  amplitude.initAll('e6f2f196f8f0fb097aee0d1fb56e333c', {"serverZone":"EU","analytics":{"autocapture":true},"sessionReplay":{"sampleRate":0.6}});
  markTrackingStarted();
  // Arrivée directe dans le back-office : rien n'est envoyé (repris à chaque changement de page dans App.tsx).
  amplitude.setOptOut(isUntrackedPath(window.location.pathname));
}
initGlobalErrorTracking();

createRoot(document.getElementById("root")!).render(<App />);
