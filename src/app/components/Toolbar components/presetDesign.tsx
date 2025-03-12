"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  RefreshCw,
  Cloud,
  Upload,
  Check,
  Trash2,
  Sliders,
} from "lucide-react";
import { usePresetStore, Preset } from "@/store/presetStore";
import { useImageStore } from "@/app/store/imageStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const PresetDesigns = () => {
  const { data: session } = useSession();
  const [showCloudinary, setShowCloudinary] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<Preset>>({
    name: "",
    filter: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
    },
  });

  const { setImage, setFilter } = useImageStore();

  const {
    presets,
    cloudinaryPresets,
    selectedPreset,
    loading,
    loadingCloudinary,
    error,
    nextCursor,
    fetchPresets,
    fetchCloudinaryPresets,
    loadMoreCloudinaryPresets,
    setSelectedPreset,
    setDefault,
    createPreset,
    deletePreset,
  } = usePresetStore();

  useEffect(() => {
    if (session) {
      fetchPresets();
    }
  }, [session, fetchPresets]);

  useEffect(() => {
    if (session && showCloudinary) {
      fetchCloudinaryPresets();
    }
  }, [session, showCloudinary, fetchCloudinaryPresets]);

  useEffect(() => {
    if (selectedPreset) {
      if (selectedPreset.filter) {
        setFilter({
          brightness: selectedPreset.filter.brightness || 100,
          contrast: selectedPreset.filter.contrast || 100,
          saturation: selectedPreset.filter.saturation || 100,
          sepia: selectedPreset.filter.sepia || 0,
        });
      }

      if (selectedPreset.url) {
        setImage(selectedPreset.url);
      }
    }
  }, [selectedPreset, setFilter, setImage]);

  const handlePresetClick = (preset: Preset) => {
    setSelectedPreset(preset);

    if (preset.filter) {
      setFilter({
        brightness: preset.filter.brightness || 100,
        contrast: preset.filter.contrast || 100,
        saturation: preset.filter.saturation || 100,
        sepia: preset.filter.sepia || 0,
      });
    }

    if (preset.url) {
      setImage(preset.url);
    }
  };

  const handleCreatePreset = async () => {
    if (!newPreset.name) {
      alert("Please enter a preset name");
      return;
    }

    setCreating(true);
    try {
      await createPreset(newPreset);
      setNewPreset({
        name: "",
        filter: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
        },
      });
    } catch (error) {
      console.error("Error creating preset:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this preset?")) {
      await deletePreset(id);
    }
  };

  const toggleSource = () => {
    setShowCloudinary(!showCloudinary);
  };

  // Ensure displayPresets is always an array
  const displayPresets = showCloudinary
    ? cloudinaryPresets || []
    : presets || [];
  const isLoading = showCloudinary ? loadingCloudinary : loading;

  if (!session) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Preset Designs</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleSource}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-700 rounded hover:bg-blue-800"
          >
            {showCloudinary ? "Show Local" : "Show Cloudinary"}{" "}
            <Cloud size={16} />
          </button>
          <button
            onClick={() =>
              showCloudinary ? fetchCloudinaryPresets() : fetchPresets()
            }
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-700 rounded hover:bg-blue-800"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      {!showCloudinary && (
        <div className="mb-6 p-3 border rounded bg-gray-50">
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
              onChange={(e) =>
                setNewPreset({ ...newPreset, name: e.target.value })
              }
              placeholder="My Preset"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="brightness" className="text-xs mb-1 block">
                Brightness: {newPreset.filter?.brightness}%
              </Label>
              <Slider
                id="brightness"
                value={[newPreset.filter?.brightness || 100]}
                min={0}
                max={200}
                step={5}
                onValueChange={(value) =>
                  setNewPreset({
                    ...newPreset,
                    filter: { ...newPreset.filter, brightness: value[0] },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="contrast" className="text-xs mb-1 block">
                Contrast: {newPreset.filter?.contrast}%
              </Label>
              <Slider
                id="contrast"
                value={[newPreset.filter?.contrast || 100]}
                min={0}
                max={200}
                step={5}
                onValueChange={(value) =>
                  setNewPreset({
                    ...newPreset,
                    filter: { ...newPreset.filter, contrast: value[0] },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="saturation" className="text-xs mb-1 block">
                Saturation: {newPreset.filter?.saturation}%
              </Label>
              <Slider
                id="saturation"
                value={[newPreset.filter?.saturation || 100]}
                min={0}
                max={200}
                step={5}
                onValueChange={(value) =>
                  setNewPreset({
                    ...newPreset,
                    filter: { ...newPreset.filter, saturation: value[0] },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="sepia" className="text-xs mb-1 block">
                Sepia: {newPreset.filter?.sepia}%
              </Label>
              <Slider
                id="sepia"
                value={[newPreset.filter?.sepia || 0]}
                min={0}
                max={100}
                step={5}
                onValueChange={(value) =>
                  setNewPreset({
                    ...newPreset,
                    filter: { ...newPreset.filter, sepia: value[0] },
                  })
                }
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
              }}
            ></div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {displayPresets && displayPresets.length > 0 ? (
            displayPresets.map((preset) => (
              <div
                key={preset.id}
                className={`relative p-2 border rounded ${
                  selectedPreset?.id === preset.id
                    ? "border-blue-500"
                    : "border-gray-200"
                } ${preset.isDefault ? "bg-blue-50" : ""}`}
              >
                <div className="flex justify-between mb-2">
                  <div className="text-xs truncate max-w-[80%]">
                    {preset.name || preset.id.split("/").pop() || "Preset"}
                  </div>
                  {!showCloudinary && (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {preset.url ? (
                  <div className="flex justify-center p-2 bg-gray-50 rounded mb-2">
                    <img
                      src={preset.url}
                      alt={preset.name || "Preset"}
                      className="object-contain max-h-24"
                      style={{
                        maxWidth: "100%",
                        filter: `
                          brightness(${preset.filter?.brightness || 100}%) 
                          contrast(${preset.filter?.contrast || 100}%) 
                          saturate(${preset.filter?.saturation || 100}%) 
                          sepia(${preset.filter?.sepia || 0}%)
                        `,
                      }}
                      onClick={() => handlePresetClick(preset)}
                    />
                  </div>
                ) : (
                  <div
                    className="h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded mb-2"
                    style={{
                      filter: `
                        brightness(${preset.filter?.brightness || 100}%) 
                        contrast(${preset.filter?.contrast || 100}%) 
                        saturate(${preset.filter?.saturation || 100}%) 
                        sepia(${preset.filter?.sepia || 0}%)
                      `,
                    }}
                    onClick={() => handlePresetClick(preset)}
                  ></div>
                )}

                <div className="grid grid-cols-2 gap-1 mb-2 text-[10px] text-gray-500">
                  <div>Brightness: {preset.filter?.brightness || 100}%</div>
                  <div>Contrast: {preset.filter?.contrast || 100}%</div>
                  <div>Saturation: {preset.filter?.saturation || 100}%</div>
                  <div>Sepia: {preset.filter?.sepia || 0}%</div>
                </div>

                <div className="flex gap-1 mb-2">
                  <button
                    onClick={() => {
                      if (preset.filter) {
                        setFilter({
                          brightness: preset.filter.brightness || 100,
                          contrast: preset.filter.contrast || 100,
                          saturation: preset.filter.saturation || 100,
                          sepia: preset.filter.sepia || 0,
                        });
                      }
                    }}
                    className="flex-1 text-xs p-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Apply Filter
                  </button>

                  <button
                    onClick={() => handlePresetClick(preset)}
                    className="flex-1 text-xs p-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Use Preset
                  </button>
                </div>

                <button
                  onClick={() => setDefault(preset)}
                  className={`w-full text-xs p-1 rounded flex items-center justify-center gap-1 ${
                    preset.isDefault
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {preset.isDefault ? (
                    <>
                      <Check size={12} /> Default
                    </>
                  ) : (
                    "Set as Default"
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-4 text-center text-gray-500">
              {showCloudinary
                ? "No presets found in Cloudinary. Upload some presets to get started."
                : "No presets found. Create some presets to get started."}
            </div>
          )}
        </div>
      )}

      {showCloudinary && nextCursor && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMoreCloudinaryPresets}
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            disabled={loadingCloudinary}
          >
            {loadingCloudinary ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetDesigns;
