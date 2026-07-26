interface SwipeProgressBarProps {
  current: number;
  total: number;
}

export const SwipeProgressBar = ({ current, total }: SwipeProgressBarProps) => {
  const pourcentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[#1a1a1a]/60 mb-1 px-1">
        <span>
          {Math.min(current, total)}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full bg-[#1a1a1a]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#AD1414] rounded-full transition-all duration-300"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
};
