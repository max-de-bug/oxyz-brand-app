import { FC } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
}

export const NumberInput: FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  unit,
}) => {
  const handleMouseDrag = (e: React.MouseEvent<HTMLInputElement>) => {
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
        className="w-16 text-xs p-1 pr-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-center"
        onMouseDown={handleMouseDrag}
        onChange={(e) => {
          const newValue = parseInt(e.target.value);
          if (!isNaN(newValue)) {
            onChange(Math.max(min, Math.min(max, newValue)));
          }
        }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
        {unit}
      </span>
    </div>
  );
};
