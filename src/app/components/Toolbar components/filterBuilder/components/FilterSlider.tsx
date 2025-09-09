import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface FilterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  className?: string;
}

export const FilterSlider: React.FC<FilterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  className = "",
}) => {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-neutral-500">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(value) => onChange(value[0])}
      />
    </div>
  );
};
