"use client";
import { FC } from "react";

interface ColorPickerProps {
  colorValue: string;
  setColorValue: (value: string) => void;
}

const ColorPicker: FC<ColorPickerProps> = ({ colorValue, setColorValue }) => {
  // Color presets
  const colorPresets = [
    { title: "Black", color: "rgb(0, 0, 0)" },
    { title: "Gray", color: "rgb(17, 17, 17)" },
    { title: "Gray (2)", color: "rgb(34, 34, 34)" },
    { title: "Gray (3)", color: "rgb(142, 142, 147)" },
    { title: "Gray (4)", color: "rgb(174, 174, 178)" },
    { title: "Gray (5)", color: "rgb(199, 199, 204)" },
    { title: "Gray (6)", color: "rgb(209, 209, 214)" },
    { title: "Gray (7)", color: "rgb(229, 229, 234)" },
    { title: "Gray (8)", color: "rgb(242, 242, 247)" },
    { title: "White", color: "rgb(255, 255, 255)" },
    { title: "Red", color: "rgb(255, 59, 48)" },
    { title: "Orange", color: "rgb(255, 149, 0)" },
    { title: "Yellow", color: "rgb(255, 204, 0)" },
    { title: "Green", color: "rgb(52, 199, 89)" },
    { title: "Mint", color: "rgb(0, 199, 190)" },
    { title: "Teal", color: "rgb(48, 176, 199)" },
    { title: "Cyan", color: "rgb(50, 173, 230)" },
    { title: "Blue", color: "rgb(0, 122, 255)" },
    { title: "Indigo", color: "rgb(88, 86, 214)" },
    { title: "Purple", color: "rgb(175, 82, 222)" },
    { title: "Pink", color: "rgb(255, 45, 85)" },
  ];

  return (
    <div className="grid gap-4">
      <input
        type="color"
        className="w-full p-1 px-1 h-10 block bg-white border border-neutral-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"
        value={colorValue}
        onChange={(e) => setColorValue(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {colorPresets.map((preset) => (
          <button
            key={preset.title}
            className="w-4 h-4 rounded focus:outline-none ring-1 ring-neutral-100 dark:ring-neutral-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
            title={preset.title}
            style={{ backgroundColor: preset.color }}
            onClick={() => setColorValue(preset.color)}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
