import { useState, useEffect } from "react";

interface LoadingScreenProps {
  isLoading: boolean;
  minDuration?: number;
}

const LoadingScreen = ({ isLoading, minDuration = 300 }: LoadingScreenProps) => {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    if (isLoading) {
      showTimer = setTimeout(() => {
        setShouldRender(true);
        requestAnimationFrame(() => setVisible(true));
      }, minDuration);
    } else {
      setVisible(false);
      hideTimer = setTimeout(() => setShouldRender(false), 500);
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isLoading, minDuration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: "#F2EDE4" }}
    >
      <div className="flex flex-col items-center gap-4">
        <span
          className="select-none uppercase"
          style={{
            color: "#1A1814",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.25em",
          }}
        >
          STAYMAKOM
        </span>

        <div
          className="origin-center"
          style={{
            width: "40px",
            height: "1px",
            backgroundColor: "#B8935A",
            animation: "loader-line 1.2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes loader-line {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
