import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as amplitude from '@amplitude/unified';
import { initGlobalErrorTracking } from "./lib/errorTracking";

amplitude.initAll('e6f2f196f8f0fb097aee0d1fb56e333c', {"serverZone":"EU","analytics":{"autocapture":true},"sessionReplay":{"sampleRate":0.6}});
initGlobalErrorTracking();

createRoot(document.getElementById("root")!).render(<App />);
