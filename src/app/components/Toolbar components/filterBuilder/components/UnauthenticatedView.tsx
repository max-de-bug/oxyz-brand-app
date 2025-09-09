import React from "react";
import { Sliders, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useImageStore } from "@/app/store/imageStore";
import { FilterSlider } from "./FilterSlider";
import { FilterPreview } from "./FilterPreview";
import { SLIDER_CONFIGS, FILTER_LABELS } from "../constants/filterConfig";

export const UnauthenticatedView: React.FC = () => {
  const {
    reset,
    images,
    brightness: imageBrightness,
    contrast: imageContrast,
    saturation: imageSaturation,
    sepia: imageSepia,
    opacity: imageOpacity,
    blur: imageBlur,
    setBrightness,
    setContrast,
    setSaturation,
    setSepia,
    setOpacity,
    setBlur,
  } = useImageStore();

  const currentFilter = {
    brightness: imageBrightness,
    contrast: imageContrast,
    saturation: imageSaturation,
    sepia: imageSepia,
    opacity: imageOpacity,
    blur: imageBlur,
  };

  return (
    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <Sliders size={16} />
          Filter Controls
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
            title="Reset filters to default values"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </button>
          <div className="text-xs text-gray-500">Sign in to save filters</div>
        </div>
      </div>

      {/* Basic filter controls for non-authenticated users */}
      <div className="space-y-4">
        <FilterSlider
          label={FILTER_LABELS.brightness}
          value={imageBrightness}
          min={SLIDER_CONFIGS.brightness.min}
          max={SLIDER_CONFIGS.brightness.max}
          step={SLIDER_CONFIGS.brightness.step}
          unit={SLIDER_CONFIGS.brightness.unit}
          onChange={setBrightness}
        />

        <FilterSlider
          label={FILTER_LABELS.contrast}
          value={imageContrast}
          min={SLIDER_CONFIGS.contrast.min}
          max={SLIDER_CONFIGS.contrast.max}
          step={SLIDER_CONFIGS.contrast.step}
          unit={SLIDER_CONFIGS.contrast.unit}
          onChange={setContrast}
        />

        <FilterSlider
          label={FILTER_LABELS.saturation}
          value={imageSaturation}
          min={SLIDER_CONFIGS.saturation.min}
          max={SLIDER_CONFIGS.saturation.max}
          step={SLIDER_CONFIGS.saturation.step}
          unit={SLIDER_CONFIGS.saturation.unit}
          onChange={setSaturation}
        />

        <FilterSlider
          label={FILTER_LABELS.sepia}
          value={imageSepia}
          min={SLIDER_CONFIGS.sepia.min}
          max={SLIDER_CONFIGS.sepia.max}
          step={SLIDER_CONFIGS.sepia.step}
          unit={SLIDER_CONFIGS.sepia.unit}
          onChange={setSepia}
        />

        <FilterSlider
          label={FILTER_LABELS.opacity}
          value={imageOpacity}
          min={SLIDER_CONFIGS.opacity.min}
          max={SLIDER_CONFIGS.opacity.max}
          step={SLIDER_CONFIGS.opacity.step}
          unit={SLIDER_CONFIGS.opacity.unit}
          onChange={setOpacity}
        />

        <FilterSlider
          label={FILTER_LABELS.blur}
          value={imageBlur}
          min={SLIDER_CONFIGS.blur.min}
          max={SLIDER_CONFIGS.blur.max}
          step={SLIDER_CONFIGS.blur.step}
          unit={SLIDER_CONFIGS.blur.unit}
          onChange={setBlur}
        />
      </div>

      {/* Preview for non-authenticated users */}
      {images.length > 0 && (
        <FilterPreview
          filter={currentFilter}
          imageUrl={images[0].url}
          className="mt-3 p-2 border rounded bg-white"
        />
      )}

      {/* Sign in prompt */}
      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mt-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Sliders size={24} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">
              Sign in to Save Filters
            </h3>
            <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
              Sign in to create, save, and reuse your favorite filter
              combinations
            </p>
          </div>
          <Link
            href="/auth/sign-in"
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            aria-label="sign-in"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
