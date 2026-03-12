import { Minus, Plus, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NightsRangeSelectorProps {
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

const NightsRangeSelector = ({ 
  minValue, 
  maxValue, 
  onMinChange, 
  onMaxChange 
}: NightsRangeSelectorProps) => {
  const decreaseMin = () => {
    if (minValue > 1) {
      const newMin = minValue - 1;
      onMinChange(newMin);
    }
  };

  const increaseMin = () => {
    if (minValue < maxValue) {
      onMinChange(minValue + 1);
    }
  };

  const decreaseMax = () => {
    if (maxValue > minValue) {
      onMaxChange(maxValue - 1);
    }
  };

  const increaseMax = () => {
    if (maxValue < 8) {
      onMaxChange(maxValue + 1);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Min nights</label>
        <div className="flex items-center justify-between border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <span>{minValue} {minValue === 1 ? "night" : "nights"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decreaseMin}
              disabled={minValue <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={increaseMin}
              disabled={minValue >= maxValue}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Max nights</label>
        <div className="flex items-center justify-between border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <span>{maxValue} {maxValue === 1 ? "night" : "nights"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decreaseMax}
              disabled={maxValue <= minValue}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={increaseMax}
              disabled={maxValue >= 8}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NightsRangeSelector;
