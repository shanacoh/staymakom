import { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
  /** Texte alternatif de l'image rendue (libellé du billet). */
  alt: string;
  className?: string;
  /** Affiché pendant le chargement. */
  loadingLabel?: string;
  onError?: () => void;
}

// Première page d'un PDF dessinée en image nette (page billet sur téléphone, aperçu back-office).
// Le PDF du prestataire n'est pas modifié : on le lit seulement pour l'afficher.
// La bibliothèque PDF n'est chargée que lorsqu'un PDF est à l'écran.
export default function PdfFirstPage({ url, alt, className, loadingLabel, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        const task = pdfjs.getDocument({ url });
        destroy = () => void task.destroy();
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;

        // Rendu à la largeur affichée × densité de l'écran, pour un QR net et scannable.
        const cssWidth = canvas.parentElement?.clientWidth || 360;
        const base = page.getViewport({ scale: 1 });
        const scale = (cssWidth / base.width) * Math.min(window.devicePixelRatio || 1, 3);
        const viewport = page.getViewport({ scale });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) {
          setState("error");
          onErrorRef.current?.();
        }
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url]);

  return (
    <div className={className}>
      {state === "loading" && loadingLabel && <p className="py-10 text-center text-sm text-neutral-400">{loadingLabel}</p>}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className={state === "ready" ? "block h-auto w-full" : "hidden"}
      />
    </div>
  );
}
