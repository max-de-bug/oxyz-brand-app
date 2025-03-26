"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Upload, Sliders } from "lucide-react";
import { usePresetStore, Preset } from "@/store/presetStore";
import { useImageStore } from "@/app/store/imageStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const PresetBuilder = () => {
  const [creating, setCreating] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<Preset>>({
    name: "",
    filter: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    },
  });

  const { setFilter } = useImageStore();

  // Apply filter changes in real-time to the canvas
  useEffect(() => {
    if (newPreset.filter) {
      setFilter({
        brightness: newPreset.filter.brightness || 100,
        contrast: newPreset.filter.contrast || 100,
        saturation: newPreset.filter.saturation || 100,
        sepia: newPreset.filter.sepia || 0,
        opacity: newPreset.filter.opacity || 100,
      });
    }
  }, [newPreset.filter, setFilter]);

  const { createPreset } = usePresetStore();

  const handleSliderChange = (property: string, value: number) => {
    setNewPreset((prev) => ({
      ...prev,
      filter: {
        ...prev.filter,
        [property]: value,
      },
    }));
  };

  const handleCreatePreset = async () => {
    if (!newPreset.name) {
      alert("Please enter a preset name");
      return;
    }

    setCreating(true);
    try {
      await createPreset(newPreset);
      // Reset form
      setNewPreset({
        name: "",
        filter: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          opacity: 100,
        },
      });
    } catch (error) {
      console.error("Error creating preset:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
        <Sliders size={16} /> Create New Preset
      </h3>

      <div className="mb-3">
        <Label htmlFor="preset-name" className="text-xs mb-1 block">
          Preset Name
        </Label>
        <Input
          id="preset-name"
          type="text"
          value={newPreset.name}
          onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
          placeholder="My Preset"
          className="h-8 text-sm"
        />
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {/* Brightness Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs">Brightness</Label>
            <span className="text-xs text-neutral-500">
              {newPreset.filter?.brightness}%
            </span>
          </div>
          <Slider
            value={[newPreset.filter?.brightness || 100]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) =>
              handleSliderChange("brightness", value[0])
            }
          />
        </div>

        {/* Contrast Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs">Contrast</Label>
            <span className="text-xs text-neutral-500">
              {newPreset.filter?.contrast}%
            </span>
          </div>
          <Slider
            value={[newPreset.filter?.contrast || 100]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) => handleSliderChange("contrast", value[0])}
          />
        </div>

        {/* Saturation Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs">Saturation</Label>
            <span className="text-xs text-neutral-500">
              {newPreset.filter?.saturation}%
            </span>
          </div>
          <Slider
            value={[newPreset.filter?.saturation || 100]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) =>
              handleSliderChange("saturation", value[0])
            }
          />
        </div>

        {/* Sepia Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs">Sepia</Label>
            <span className="text-xs text-neutral-500">
              {newPreset.filter?.sepia}%
            </span>
          </div>
          <Slider
            value={[newPreset.filter?.sepia || 0]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange("sepia", value[0])}
          />
        </div>

        {/* Opacity Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs">Opacity</Label>
            <span className="text-xs text-neutral-500">
              {newPreset.filter?.opacity}%
            </span>
          </div>
          <Slider
            value={[newPreset.filter?.opacity || 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange("opacity", value[0])}
          />
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={handleCreatePreset}
          disabled={creating || !newPreset.name}
          className="w-full h-8 text-sm"
        >
          {creating ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Upload size={14} className="mr-2" />
              Create Preset
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      <div className="mt-3 p-2 border rounded bg-white">
        <div className="text-xs text-center mb-1">Preview</div>
        <div
          className="h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded"
          style={{
            filter: `
              brightness(${newPreset.filter?.brightness || 100}%) 
              contrast(${newPreset.filter?.contrast || 100}%) 
              saturate(${newPreset.filter?.saturation || 100}%) 
              sepia(${newPreset.filter?.sepia || 0}%)
            `,
            opacity: `${(newPreset.filter?.opacity || 100) / 100}`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default PresetBuilder;
