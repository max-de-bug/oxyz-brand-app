import { useEffect } from "react";
import { FilterValues } from "@/app/store/filterStore";
import { useImageStore } from "@/app/store/imageStore";

interface UseFilterEffectsProps {
  filter: FilterValues;
  selectedFilter: FilterValues | null;
}

export const useFilterEffects = ({
  filter,
  selectedFilter,
}: UseFilterEffectsProps) => {
  const {
    setBrightness,
    setContrast,
    setSaturation,
    setSepia,
    setOpacity,
    setBlur,
  } = useImageStore();

  // Apply filter changes in real-time to the canvas
  useEffect(() => {
    setBrightness(filter.brightness || 100);
    setContrast(filter.contrast || 100);
    setSaturation(filter.saturation || 100);
    setSepia(filter.sepia || 0);
    setOpacity(filter.opacity || 100);
    setBlur(filter.blur || 0);
  }, [
    filter,
    setBrightness,
    setContrast,
    setSaturation,
    setSepia,
    setOpacity,
    setBlur,
  ]);

  // Apply selected filter to the canvas
  useEffect(() => {
    if (selectedFilter) {
      setBrightness(selectedFilter.brightness || 100);
      setContrast(selectedFilter.contrast || 100);
      setSaturation(selectedFilter.saturation || 100);
      setSepia(selectedFilter.sepia || 0);
      setOpacity(selectedFilter.opacity || 100);
      setBlur(selectedFilter.blur || 0);
    }
  }, [
    selectedFilter,
    setBrightness,
    setContrast,
    setSaturation,
    setSepia,
    setOpacity,
    setBlur,
  ]);
};
