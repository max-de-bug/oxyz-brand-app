"use client";
import { FC } from "react";
import { useDesignStore } from "@/app/store/designStore";

interface SizeControlsProps {
  minSize: number;
  setMinSize: (value: number) => void;
  maxSize: number;
  setMaxSize: (value: number) => void;
  spacing: number;
  setSpacing: (value: number) => void;
  rotation: number;
  setRotation: (value: number) => void;
}

const NumberInput: FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  disabled?: boolean;
}> = ({ value, onChange, min, max, unit, disabled = false }) => {
  const handleMouseDrag = (e: React.MouseEvent<HTMLInputElement>) => {
    if (disabled) return;

    const startX = e.clientX;
    const startValue = value;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newValue = Math.max(
        min,
        Math.min(max, startValue + Math.round(diff / 2))
      );
      onChange(newValue);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="relative inline-block">
      <input
        type="text"
        value={value}
        className={`w-16 text-xs p-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-center ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onMouseDown={disabled ? undefined : handleMouseDrag}
        onChange={(e) => {
          if (disabled) return;
          const newValue = parseInt(e.target.value);
          if (!isNaN(newValue)) {
            onChange(Math.max(min, Math.min(max, newValue)));
          }
        }}
        disabled={disabled}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
        {unit}
      </span>
    </div>
  );
};

const SizeControls: FC<SizeControlsProps> = ({
 
  maxSize,
  setMaxSize,
  spacing,
  setSpacing,
  rotation,
  setRotation,
}) => {
  // Get devMode from the design store
  const { devMode } = useDesignStore();

  // If dev mode is disabled, show a message
  if (!devMode) {
    return (
      <div className="my-4">
        <div className="p-3 border border-dashed border-gray-500 rounded-md bg-gray-800">
          <p className="text-sm text-gray-400 text-center">
            Enable Dev Mode to adjust image size and rotation
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 my-4">
        <div>
          <div className="flex items-center flex-grow gap-2 mb-1">
            <label htmlFor="maxSize" className="block text-xs font-medium">
              Max Size:
            </label>
            <NumberInput
              value={maxSize}
              onChange={setMaxSize}
              min={1}
              max={220}
              unit="px"
              disabled={!devMode}
            />
          </div>
          <input
            type="range"
            id="maxSize"
            min="1"
            max="220"
            className={`w-full h-2 bg-neutral-200 rounded-lg appearance-none dark:bg-neutral-700 ${
              devMode ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
            value={maxSize}
            onChange={(e) => setMaxSize(Number(e.target.value))}
            disabled={!devMode}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="spacing" className="block text-xs font-medium">
              Spacing:
            </label>
            <NumberInput
              value={spacing}
              onChange={setSpacing}
              min={10}
              max={220}
              unit="px"
              disabled={!devMode}
            />
          </div>
          <input
            type="range"
            id="spacing"
            min="10"
            max="220"
            className={`w-full h-2 bg-neutral-200 rounded-lg appearance-none dark:bg-neutral-700 ${
              devMode ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            disabled={!devMode}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="rotation" className="block text-xs font-medium">
              Rotation:
            </label>
            <NumberInput
              value={rotation}
              onChange={setRotation}
              min={0}
              max={360}
              unit="°"
              disabled={!devMode}
            />
          </div>
          <input
            type="range"
            id="rotation"
            min="0"
            max="360"
            className={`w-full h-2 bg-neutral-200 rounded-lg appearance-none dark:bg-neutral-700 ${
              devMode ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            disabled={!devMode}
          />
        </div>
      </div>
    </>
  );
};

export default SizeControls;
