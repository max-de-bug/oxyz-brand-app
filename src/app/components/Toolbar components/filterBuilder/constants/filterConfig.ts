import { FilterValues } from "@/app/store/filterStore";

export const FILTER_DEFAULTS: FilterValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  opacity: 100,
  blur: 0,
};

export const SLIDER_CONFIGS = {
  brightness: { min: 0, max: 200, step: 1, unit: "%" },
  contrast: { min: 0, max: 200, step: 1, unit: "%" },
  saturation: { min: 0, max: 200, step: 1, unit: "%" },
  sepia: { min: 0, max: 100, step: 1, unit: "%" },
  opacity: { min: 0, max: 100, step: 1, unit: "%" },
  blur: { min: 0, max: 20, step: 0.5, unit: "px" },
} as const;

export const FILTER_LABELS = {
  brightness: "Brightness",
  contrast: "Contrast",
  saturation: "Saturation",
  sepia: "Sepia",
  opacity: "Opacity",
  blur: "Blur",
} as const;
