import { useState, useEffect } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
}

const RotatingText = ({ words, interval = 2000 }: RotatingTextProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  if (words.length === 0) return null;

  return (
    <span className="inline-block min-w-[200px] text-left">
      <span
        className={`inline-block transition-all duration-300 uppercase ${
          isAnimating
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
};

export default RotatingText;
