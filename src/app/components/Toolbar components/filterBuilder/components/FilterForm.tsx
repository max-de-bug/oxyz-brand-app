import React from "react";
import { Loader2, Upload, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterSlider } from "./FilterSlider";
import { FilterPreview } from "./FilterPreview";
import { FilterValues } from "@/app/store/filterStore";
import { SLIDER_CONFIGS, FILTER_LABELS } from "../constants/filterConfig";

interface FilterFormProps {
  newFilter: {
    name: string;
    filter: FilterValues;
    isValid: boolean;
    errors: string[];
  };
  onNameChange: (name: string) => void;
  onFilterChange: (property: keyof FilterValues, value: number) => void;
  onCreateFilter: () => void;
  onReset: () => void;
  isCreating: boolean;
  createError: Error | null;
}

export const FilterForm: React.FC<FilterFormProps> = ({
  newFilter,
  onNameChange,
  onFilterChange,
  onCreateFilter,
  onReset,
  isCreating,
  createError,
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium flex items-center gap-1">
          Create New Filter
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
          title="Reset filters to default values"
        >
          <RotateCcw size={14} className="mr-1" />
          Reset
        </button>
      </div>

      <div className="mb-3">
        <Label htmlFor="filter-name" className="text-xs mb-1 block">
          Filter Name
        </Label>
        <Input
          id="filter-name"
          type="text"
          value={newFilter.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Filter"
          className="h-8 text-sm"
        />
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <FilterSlider
          label={FILTER_LABELS.brightness}
          value={newFilter.filter.brightness}
          min={SLIDER_CONFIGS.brightness.min}
          max={SLIDER_CONFIGS.brightness.max}
          step={SLIDER_CONFIGS.brightness.step}
          unit={SLIDER_CONFIGS.brightness.unit}
          onChange={(value) => onFilterChange("brightness", value)}
        />

        <FilterSlider
          label={FILTER_LABELS.contrast}
          value={newFilter.filter.contrast}
          min={SLIDER_CONFIGS.contrast.min}
          max={SLIDER_CONFIGS.contrast.max}
          step={SLIDER_CONFIGS.contrast.step}
          unit={SLIDER_CONFIGS.contrast.unit}
          onChange={(value) => onFilterChange("contrast", value)}
        />

        <FilterSlider
          label={FILTER_LABELS.saturation}
          value={newFilter.filter.saturation}
          min={SLIDER_CONFIGS.saturation.min}
          max={SLIDER_CONFIGS.saturation.max}
          step={SLIDER_CONFIGS.saturation.step}
          unit={SLIDER_CONFIGS.saturation.unit}
          onChange={(value) => onFilterChange("saturation", value)}
        />

        <FilterSlider
          label={FILTER_LABELS.sepia}
          value={newFilter.filter.sepia}
          min={SLIDER_CONFIGS.sepia.min}
          max={SLIDER_CONFIGS.sepia.max}
          step={SLIDER_CONFIGS.sepia.step}
          unit={SLIDER_CONFIGS.sepia.unit}
          onChange={(value) => onFilterChange("sepia", value)}
        />

        <FilterSlider
          label={FILTER_LABELS.opacity}
          value={newFilter.filter.opacity}
          min={SLIDER_CONFIGS.opacity.min}
          max={SLIDER_CONFIGS.opacity.max}
          step={SLIDER_CONFIGS.opacity.step}
          unit={SLIDER_CONFIGS.opacity.unit}
          onChange={(value) => onFilterChange("opacity", value)}
        />

        <FilterSlider
          label={FILTER_LABELS.blur}
          value={newFilter.filter.blur}
          min={SLIDER_CONFIGS.blur.min}
          max={SLIDER_CONFIGS.blur.max}
          step={SLIDER_CONFIGS.blur.step}
          unit={SLIDER_CONFIGS.blur.unit}
          onChange={(value) => onFilterChange("blur", value)}
        />
      </div>

      <div className="mt-4">
        <Button
          onClick={onCreateFilter}
          disabled={!newFilter.isValid || isCreating}
          className="w-full h-8 text-sm"
        >
          {isCreating ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Upload size={14} className="mr-2" />
              Create Filter
            </>
          )}
        </Button>

        {!newFilter.isValid && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <X size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">
              Please enter a name for your filter
            </p>
          </div>
        )}

        {createError && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <X size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">
              {createError.message ||
                "Error creating filter. Please try again."}
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      <FilterPreview
        filter={newFilter.filter}
        className="mt-3 p-2 border rounded bg-white"
      />
    </>
  );
};
