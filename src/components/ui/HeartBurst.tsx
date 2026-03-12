import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface HeartBurstProps {
  trigger: boolean;
  onComplete?: () => void;
}

const HEART_COUNT = 10;

export default function HeartBurst({ trigger, onComplete }: HeartBurstProps) {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; delay: number; scale: number; rotation: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newHearts = Array.from({ length: HEART_COUNT }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 80,
        y: -20 - Math.random() * 50,
        delay: Math.random() * 150,
        scale: 0.5 + Math.random() * 0.8,
        rotation: (Math.random() - 0.5) * 60,
      }));
      setHearts(newHearts);

      const timeout = setTimeout(() => {
        setHearts([]);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  if (hearts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="absolute left-1/2 top-1/2 fill-rose-500 text-rose-500 animate-heart-float"
          style={{
            '--float-x': `${heart.x}px`,
            '--float-y': `${heart.y}px`,
            '--float-rotate': `${heart.rotation}deg`,
            width: `${10 * heart.scale}px`,
            height: `${10 * heart.scale}px`,
            animationDelay: `${heart.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
