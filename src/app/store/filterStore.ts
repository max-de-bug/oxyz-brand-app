import { create } from "zustand";

interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;

  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,

  setFilter: (filter) =>
    set((state) => ({
      ...state,
      ...filter,
    })),

  resetFilter: () =>
    set({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
    }),
}));
