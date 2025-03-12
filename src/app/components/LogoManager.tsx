"use client";

import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useImageStore, CanvasLogo } from "@/app/store/imageStore";
import {
  Trash2,
  Move,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const LogoManager = () => {
  const {
    logos,
    selectLogo,
    updateLogo,
    deleteLogo,
    clearLogos,
    reorderLogos,
  } = useImageStore();

  // Move logo up in z-index (rendered later)
  const moveLogoUp = (index: number) => {
    if (index >= logos.length - 1) return; // Already at top
    reorderLogos(index, index + 1);
  };

  // Move logo down in z-index (rendered earlier)
  const moveLogoDown = (index: number) => {
    if (index <= 0) return; // Already at bottom
    reorderLogos(index, index - 1);
  };

  if (logos.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Canvas Logos ({logos.length})</h3>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm("Remove all logos from canvas?")) {
              clearLogos();
            }
          }}
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {logos.map((logo, index) => (
          <div
            key={logo.id}
            className={`p-2 rounded flex items-center gap-2 ${
              logo.isSelected
                ? "bg-blue-50 border border-blue-200"
                : "bg-white border"
            }`}
            onClick={() => selectLogo(logo.id)}
          >
            <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
              <img
                src={logo.url}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Logo {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLogoDown(index);
                    }}
                    disabled={index === 0}
                    title="Move backward"
                  >
                    <ArrowDown
                      size={14}
                      className={index === 0 ? "opacity-30" : ""}
                    />
                  </button>
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLogoUp(index);
                    }}
                    disabled={index === logos.length - 1}
                    title="Move forward"
                  >
                    <ArrowUp
                      size={14}
                      className={index === logos.length - 1 ? "opacity-30" : ""}
                    />
                  </button>
                  <button
                    className="p-1 text-red-500 hover:text-red-700 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLogo(logo.id);
                    }}
                    title="Remove logo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {logo.isSelected && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">
                      Size: {logo.size.toFixed(0)}%
                    </span>
                    <Slider
                      value={[logo.size]}
                      min={5}
                      max={100}
                      step={1}
                      onValueChange={(value) =>
                        updateLogo(logo.id, { size: value[0] })
                      }
                      className="flex-grow"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Position:</span>
                    <div className="flex gap-1">
                      <button
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLogo(logo.id, {
                            position: { x: 50, y: 50 },
                          });
                        }}
                        title="Center logo"
                      >
                        <Move size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoManager;
