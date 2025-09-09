"use client";

import React, { useState, useEffect } from "react";
import { Sliders } from "lucide-react";
import { useAuth } from "@/app/store/auth-context";
import { Filter, useFilterStore } from "@/app/store/filterStore";
import { useFilters } from "@/lib/api/queries/filter-queries";
import { useFilterState } from "./hooks/useFilterState";
import { useFilterEffects } from "./hooks/useFilterEffects";
import { useFilterActions } from "./hooks/useFilterActions";
import { UnauthenticatedView } from "./components/UnauthenticatedView";
import { FilterForm } from "./components/FilterForm";
import { SavedFiltersList } from "./components/SavedFiltersList";

const FilterBuilder: React.FC = () => {
  const { session } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);

  const { newFilter, updateFilter, updateFilterName, resetFilter, setFilter } =
    useFilterState();

  const {
    data: filters = [],
    isLoading: filtersLoading,
    error: filtersError,
  } = useFilters();

  const {
    handleCreateFilter,
    handleDeleteFilter,
    handleApplyFilter,
    handleResetFilters,
    isCreating,
    isDeleting,
    createError,
  } = useFilterActions();

  const filterStore = useFilterStore();

  // Apply filter effects
  useFilterEffects({
    filter: newFilter.filter,
    selectedFilter,
  });

  // Sync with filter store's active filter
  useEffect(() => {
    const activeFilter = filterStore.activeFilter;
    if (activeFilter) {
      setSelectedFilter(activeFilter);
    }
  }, [filterStore.activeFilter]);

  const handleSliderChange = (
    property: keyof typeof newFilter.filter,
    value: number
  ) => {
    updateFilter(property, value);
  };

  const handleCreateFilterClick = async () => {
    const createdFilter = await handleCreateFilter({
      name: newFilter.name,
      filter: newFilter.filter,
    });

    if (createdFilter) {
      setSelectedFilter(createdFilter);
      resetFilter();
    }
  };

  const handleDeleteFilterClick = async (id: string) => {
    const success = await handleDeleteFilter(id);
    if (success && selectedFilter?.id === id) {
      setSelectedFilter(null);
    }
  };

  const handleApplyFilterClick = (filter: Filter) => {
    const newSelectedFilter = handleApplyFilter(filter, selectedFilter);
    setSelectedFilter(newSelectedFilter);
  };

  const handleResetClick = () => {
    handleResetFilters();
    setSelectedFilter(null);
    resetFilter();
  };

  // Render sign-in prompt for non-authenticated users
  if (!session) {
    return <UnauthenticatedView />;
  }

  return (
    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <Sliders size={16} />
          {selectedFilter
            ? `Filter: ${selectedFilter.name}`
            : "Create New Filter"}
        </h3>
      </div>

      <FilterForm
        newFilter={newFilter}
        onNameChange={updateFilterName}
        onFilterChange={handleSliderChange}
        onCreateFilter={handleCreateFilterClick}
        onReset={handleResetClick}
        isCreating={isCreating}
        createError={createError}
      />

      <SavedFiltersList
        filters={filters}
        selectedFilter={selectedFilter}
        isLoading={filtersLoading}
        error={filtersError}
        onApplyFilter={handleApplyFilterClick}
        onDeleteFilter={handleDeleteFilterClick}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default FilterBuilder;
