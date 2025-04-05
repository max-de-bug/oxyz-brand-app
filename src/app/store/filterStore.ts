import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

export interface FilterValues {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sepia?: number;
  opacity?: number;
}

export interface Filter {
  id: string;
  name: string;
  filter: FilterValues;
  url?: string;
  publicId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FilterStore {
  filters: Filter[];
  activeFilter: Filter | null;
  loading: boolean;
  error: string | null;

  fetchFilters: () => Promise<void>;
  createFilter: (filter: {
    name: string;
    filter: FilterValues;
  }) => Promise<Filter | undefined>;
  setActiveFilter: (filter: Filter | null) => void;
  deleteFilter: (id: string) => Promise<void>;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: [],
  activeFilter: null,
  loading: false,
  error: null,

  fetchFilters: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.get<Filter[]>("/filters");
      set({ filters: response, loading: false });
    } catch (error) {
      console.error("Error fetching filters:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch filters",
        loading: false,
      });
    }
  },

  createFilter: async (filter) => {
    try {
      set({ loading: true, error: null });
      const response = await apiClient.post<Filter>("/filters", filter);

      // Add the new filter to the list and set it as active
      set((state) => ({
        filters: [...state.filters, response],
        activeFilter: response,
        loading: false,
      }));

      return response;
    } catch (error) {
      console.error("Error creating filter:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to create filter",
        loading: false,
      });
    }
  },

  /**
   * Sets or unsets the active filter.
   * Passing null will clear the active filter and reset to default values.
   * @param filter The filter to set as active, or null to clear the active filter
   */
  setActiveFilter: (filter: Filter | null) => {
    set({ activeFilter: filter });
  },

  deleteFilter: async (id) => {
    try {
      set({ loading: true, error: null });
      await apiClient.delete(`/filters/${id}`);

      // Remove the filter from the list and clear active filter if it was selected
      set((state) => ({
        filters: state.filters.filter((f) => f.id !== id),
        activeFilter: state.activeFilter?.id === id ? null : state.activeFilter,
        loading: false,
      }));
    } catch (error) {
      console.error("Error deleting filter:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete filter",
        loading: false,
      });
    }
  },
}));
