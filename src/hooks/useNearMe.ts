import { useCallback, useState } from "react";
import { isInIsrael } from "@/lib/catalogue/geo";
import type { Position } from "@/lib/regions";

/** Pourquoi « Autour de moi » n'a pas pu s'activer. */
export type NearMeProblem = "denied" | "outside" | "unavailable";

/**
 * Demande la position du visiteur, uniquement quand il clique sur « Autour de moi » (jamais à l'arrivée
 * sur le site). La position reste dans le navigateur : elle n'est ni enregistrée ni envoyée.
 */
export function useNearMe() {
  const [position, setPosition] = useState<Position | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [problem, setProblem] = useState<NearMeProblem | null>(null);

  const locate = useCallback((): Promise<Position | NearMeProblem> => {
    setProblem(null);
    if (!("geolocation" in navigator)) {
      setProblem("unavailable");
      return Promise.resolve("unavailable");
    }
    setIsLocating(true);
    return new Promise((resolve) => {
      const fail = (reason: NearMeProblem) => {
        setIsLocating(false);
        setProblem(reason);
        resolve(reason);
      };
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          // Hors d'Israël, « Autour de moi » ne trouverait rien : on le dit plutôt que d'afficher une grille vide.
          if (!isInIsrael(coords.latitude, coords.longitude)) return fail("outside");
          const found = { lat: coords.latitude, lng: coords.longitude };
          setIsLocating(false);
          setPosition(found);
          resolve(found);
        },
        (error) => fail(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
      );
    });
  }, []);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { position, isLocating, problem, locate, clearProblem };
}
