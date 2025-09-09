import { useState, useCallback } from "react";
import { FilterValues } from "@/app/store/filterStore";
import { FILTER_DEFAULTS } from "../constants/filterConfig";

interface NewFilterState {
  name: string;
  filter: FilterValues;
  isValid: boolean;
  errors: string[];
}

export const useFilterState = () => {
  const [newFilter, setNewFilter] = useState<NewFilterState>({
    name: "",
    filter: FILTER_DEFAULTS,
    isValid: false,
    errors: [],
  });

  const updateFilter = useCallback(
    (property: keyof FilterValues, value: number) => {
      setNewFilter((prev) => ({
        ...prev,
        filter: { ...prev.filter, [property]: value },
      }));
    },
    []
  );

  const updateFilterName = useCallback((name: string) => {
    setNewFilter((prev) => ({
      ...prev,
      name,
      isValid: name.trim().length > 0,
      errors: name.trim().length === 0 ? ["Please enter a filter name"] : [],
    }));
  }, []);

  const resetFilter = useCallback(() => {
    setNewFilter({
      name: "",
      filter: FILTER_DEFAULTS,
      isValid: false,
      errors: [],
    });
  }, []);

  const setFilter = useCallback((filter: FilterValues) => {
    setNewFilter((prev) => ({
      ...prev,
      filter,
    }));
  }, []);

  return {
    newFilter,
    updateFilter,
    updateFilterName,
    resetFilter,
    setFilter,
    setNewFilter,
  };
};
