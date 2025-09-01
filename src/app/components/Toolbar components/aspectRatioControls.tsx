"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useDesignStore } from "@/app/store/designStore";

const AspectRatioControls = () => {
  const { aspectRatio, setAspectRatio, devMode } = useDesignStore();

  const ratios = [
    { label: "16:9", value: "16:9" },
    { label: "1:1", value: "1:1" },
    { label: "9:16", value: "9:16" },
    { label: "4:3", value: "4:3" },
    { label: "3:4", value: "3:4" },
  ];

  // If devMode is disabled, explain that Dev Mode is required
  if (!devMode) {
    return (
      <div className="py-4">
        <h2 className="text-lg font-semibold mb-3">Aspect Ratio</h2>
        <div className="p-3 border border-dashed border-gray-500 rounded-md bg-gray-800">
          <p className="text-sm text-gray-400 text-center">
            Enable Dev Mode to change aspect ratio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold mb-3">Aspect Ratio</h2>
      <div className="grid grid-cols-3 gap-2">
        {ratios.map((ratio) => (
          <Button
            key={ratio.value}
            variant={aspectRatio === ratio.value ? "default" : "outline"}
            className={`py-1 px-2 h-auto ${
              aspectRatio === ratio.value
                ? "bg-blue-600 text-white"
                : "bg-transparent"
            }`}
            onClick={() => setAspectRatio(ratio.value)}
          >
            {ratio.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioControls;
