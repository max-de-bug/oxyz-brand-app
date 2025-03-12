"use client";
import { NumberInput } from "@/app/utils/numberInput";
import { FC } from "react";

interface PositionControlsProps {
  translationX: number;
  setTranslationX: (value: number) => void;
  translationY: number;
  setTranslationY: (value: number) => void;
}

const PositionControls: FC<PositionControlsProps> = ({
  translationX,
  setTranslationX,
  translationY,
  setTranslationY,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="translationX" className="block text-xs font-medium">
            X:
          </label>
          <NumberInput
            value={translationX}
            onChange={setTranslationX}
            min={-500}
            max={500}
            unit="px"
          />
        </div>
        <input
          type="range"
          id="translationX"
          min="-500"
          max="500"
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
          value={translationX}
          onChange={(e) => setTranslationX(Number(e.target.value))}
        />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="translationY" className="block text-xs font-medium">
            Y:
          </label>
          <NumberInput
            value={translationY}
            onChange={setTranslationY}
            min={-500}
            max={500}
            unit="px"
          />
        </div>
        <input
          type="range"
          id="translationY"
          min="-500"
          max="500"
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
          value={translationY}
          onChange={(e) => setTranslationY(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default PositionControls;
