// Zone de signature au doigt (ou à la souris). Renvoie l'image PNG de la signature, ou null si vide.

import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  clearLabel: string;
  onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ label, clearLabel, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  // La zone est dessinée à la résolution de l'écran pour un trait net sur téléphone.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (empty) setEmpty(false);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (!empty && canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setEmpty(true);
    onChange(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-neutral-700">{label}</span>
        <button type="button" onClick={clear} className="text-[12px] font-medium text-neutral-500 underline underline-offset-4">
          {clearLabel}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={label}
        className="h-40 w-full touch-none rounded-[10px] border border-dashed border-neutral-400 bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}
