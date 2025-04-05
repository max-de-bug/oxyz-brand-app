"use client";
import { FC } from "react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface ColorPickerProps {
  colorValue: string;
  setColorValue: (value: string) => void;
}

const ColorPicker: FC<ColorPickerProps> = ({ colorValue, setColorValue }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // O.XYZ modern color palette
  const colorPresets = [
    // Dark tones
    { title: "Black", color: "#050505" },
    { title: "Dark Gray", color: "#1a1a1a" },
    { title: "Charcoal", color: "#2a2a2a" },

    // Blue tones (primary brand colors)
    { title: "Deep Blue", color: "#0b2b4f" },
    { title: "Electric Blue", color: "#0066ff" },
    { title: "Bright Blue", color: "#44aaff" },

    // Purple tones
    { title: "Deep Purple", color: "#2d0f6a" },
    { title: "Electric Purple", color: "#7b2fff" },
    { title: "Bright Purple", color: "#a570ff" },

    // Gradient starting points
    { title: "Neon Pink", color: "#ff2a6a" },
    { title: "Neon Blue", color: "#00aaff" },
    { title: "Neon Green", color: "#3aff8c" },
    { title: "Neon Yellow", color: "#fff75e" },

    // Neutral tones
    { title: "White", color: "#ffffff" },
    { title: "Light Gray", color: "#dadce0" },
    { title: "Medium Gray", color: "#9aa0a6" },
  ];

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="grid gap-4">
      <div className="relative">
        <div className="flex items-center bg-[#171717] rounded-md overflow-hidden border border-[#333333]">
          <div
            className="w-10 h-10 flex-shrink-0"
            style={{ backgroundColor: colorValue }}
          />
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none px-3 py-2 text-sm text-white font-mono"
            value={colorValue}
            onChange={(e) => setColorValue(e.target.value)}
          />
          <button
            onClick={() => copyToClipboard(colorValue)}
            className="px-3 py-2 opacity-60 hover:opacity-100 transition-opacity"
            title="Copy color code"
          >
            {copiedColor === colorValue ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} className="text-white" />
            )}
          </button>
        </div>
        <input
          type="color"
          className="absolute top-0 right-4 transform translate-y-1/3 w-5 h-5 opacity-0 cursor-pointer"
          value={colorValue}
          onChange={(e) => setColorValue(e.target.value)}
        />
      </div>

      <div className="bg-[#171717] p-3 rounded-md border border-[#333333]">
        <div className="mb-2 text-xs text-[#888888]">Color Presets</div>
        <div className="grid grid-cols-8 gap-2">
          {colorPresets.map((preset) => (
            <button
              key={preset.title}
              className="w-6 h-6 rounded-full focus:outline-none ring-1 ring-white/10 transition-transform hover:scale-110 hover:ring-white/30 focus:ring-2 focus:ring-blue-500"
              title={preset.title}
              style={{ backgroundColor: preset.color }}
              onClick={() => setColorValue(preset.color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
