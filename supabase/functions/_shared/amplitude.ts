// Envoi d'un événement à Amplitude depuis une fonction serveur (même projet que le site).
// Le suivi ne doit jamais bloquer ni faire échouer l'action qu'il décrit : toute erreur est avalée.

// Clé du projet Amplitude du site (déjà publique dans le navigateur, voir src/main.tsx).
const AMPLITUDE_API_KEY = Deno.env.get("AMPLITUDE_API_KEY") || "e6f2f196f8f0fb097aee0d1fb56e333c";
const AMPLITUDE_ENDPOINT = "https://api.eu.amplitude.com/2/httpapi";

export async function trackServerEvent(
  eventType: string,
  /** Identifiant stable de la chose suivie (ex. la réservation), 5 caractères minimum. */
  deviceId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  try {
    const response = await fetch(AMPLITUDE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: AMPLITUDE_API_KEY,
        events: [{ event_type: eventType, device_id: deviceId, time: Date.now(), event_properties: properties, platform: "server" }],
      }),
    });
    if (!response.ok) console.error(`Amplitude ${eventType}:`, await response.text());
  } catch (error) {
    console.error(`Amplitude ${eventType} impossible:`, error);
  }
}
