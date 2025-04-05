"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Upload, Sliders, Trash2, Check, X } from "lucide-react";
import { useImageStore } from "@/app/store/imageStore";
import { Filter, FilterValues, useFilterStore } from "@/app/store/filterStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useFilters,
  useCreateFilter,
  useDeleteFilter,
} from "@/lib/api/queries";

const FilterBuilder = () => {
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [newFilter, setNewFilter] = useState<{
    name: string;
    filter: FilterValues;
  }>({
    name: "",
    filter: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
      opacity: 100,
    },
  });

  const { toast } = useToast();
  const { setFilter } = useImageStore();

  // Replace filter store with React Query hooks
  const {
    data: filters = [],
    isLoading: filtersLoading,
    error: filtersError,
  } = useFilters();
  const createFilterMutation = useCreateFilter();
  const deleteFilterMutation = useDeleteFilter();
  const filterStore = useFilterStore();

  // Add useEffect to sync with filter store's active filter
  useEffect(() => {
    const activeFilter = filterStore.activeFilter;
    if (activeFilter) {
      setSelectedFilter(activeFilter);
    }
  }, [filterStore.activeFilter]);

  // Apply filter changes in real-time to the canvas
  useEffect(() => {
    if (newFilter.filter) {
      setFilter({
        brightness: newFilter.filter.brightness || 100,
        contrast: newFilter.filter.contrast || 100,
        saturation: newFilter.filter.saturation || 100,
        sepia: newFilter.filter.sepia || 0,
        opacity: newFilter.filter.opacity || 100,
      });
    }
  }, [newFilter.filter, setFilter]);

  // Apply selected filter to the canvas
  useEffect(() => {
    if (selectedFilter) {
      setFilter({
        brightness: selectedFilter.filter.brightness || 100,
        contrast: selectedFilter.filter.contrast || 100,
        saturation: selectedFilter.filter.saturation || 100,
        sepia: selectedFilter.filter.sepia || 0,
        opacity: selectedFilter.filter.opacity || 100,
      });
    }
  }, [selectedFilter, setFilter]);

  const handleSliderChange = (property: string, value: number) => {
    setNewFilter((prev) => ({
      ...prev,
      filter: {
        ...prev.filter,
        [property]: value,
      },
    }));
  };

  const handleCreateFilter = async () => {
    console.log("Create filter button clicked");

    if (!newFilter.name) {
      toast({
        title: "Error",
        description: "Please enter a filter name",
        variant: "destructive",
      });
      return;
    }

    console.log("Creating filter:", newFilter);
    try {
      const createdFilter = await createFilterMutation.mutateAsync(newFilter);
      console.log("Filter created successfully:", createdFilter);
      // Set the newly created filter as selected
      setSelectedFilter(createdFilter);

      // Reset form after successful creation
      setNewFilter({
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
      console.error("Error creating filter:", error);
      // Error is handled by the mutation's onError callback
    }
  };

  const handleDeleteFilter = async (id: string) => {
    try {
      await deleteFilterMutation.mutateAsync(id);
      if (selectedFilter?.id === id) {
        setSelectedFilter(null);
      }
      toast({
        title: "Success",
        description: "Filter deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting filter:", error);
      // Error is handled by the mutation's onError callback
    }
  };

  const handleApplyFilter = (filter: Filter) => {
    console.log("Applying or toggling filter:", filter);

    // Check if this filter is already selected
    if (selectedFilter?.id === filter.id) {
      // If clicking the selected filter, unselect it and reset to default values
      setSelectedFilter(null);
      filterStore.setActiveFilter(null);

      // Reset filter values to defaults
      setFilter({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sepia: 0,
        opacity: 100,
      });

      toast({
        title: "Filter Removed",
        description: `Filter '${filter.name}' has been removed`,
      });
    } else {
      // Select the new filter
      setSelectedFilter(filter);
      filterStore.setActiveFilter(filter);

      // Apply the filter values to the image
      setFilter({
        brightness: filter.filter.brightness || 100,
        contrast: filter.filter.contrast || 100,
        saturation: filter.filter.saturation || 100,
        sepia: filter.filter.sepia || 0,
        opacity: filter.filter.opacity || 100,
      });

      toast({
        title: "Filter Applied",
        description: `Filter '${filter.name}' applied successfully`,
      });
    }
  };

  return (
    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
        <Sliders size={16} />
        {selectedFilter
          ? `Filter: ${selectedFilter.name}`
          : "Create New Filter"}
      </h3>

      <div className="mb-3">
        <Label htmlFor="filter-name" className="text-xs mb-1 block">
          Filter Name
        </Label>
        <Input
          id="filter-name"
          type="text"
          value={newFilter.name}
          onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
          placeholder="My Filter"
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
              {newFilter.filter?.brightness}%
            </span>
          </div>
          <Slider
            value={[newFilter.filter?.brightness || 100]}
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
              {newFilter.filter?.contrast}%
            </span>
          </div>
          <Slider
            value={[newFilter.filter?.contrast || 100]}
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
              {newFilter.filter?.saturation}%
            </span>
          </div>
          <Slider
            value={[newFilter.filter?.saturation || 100]}
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
              {newFilter.filter?.sepia}%
            </span>
          </div>
          <Slider
            value={[newFilter.filter?.sepia || 0]}
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
              {newFilter.filter?.opacity}%
            </span>
          </div>
          <Slider
            value={[newFilter.filter?.opacity || 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => handleSliderChange("opacity", value[0])}
          />
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={handleCreateFilter}
          disabled={!newFilter.name || createFilterMutation.isPending}
          className="w-full h-8 text-sm"
        >
          {createFilterMutation.isPending ? (
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
        {!newFilter.name && (
          <p className="text-xs text-red-500 mt-1">
            Please enter a filter name
          </p>
        )}
        {createFilterMutation.isError && (
          <p className="text-xs text-red-500 mt-1">
            Error creating filter. Please try again.
          </p>
        )}
      </div>

      {/* Preview */}
      <div className="mt-3 p-2 border rounded bg-white">
        <div className="text-xs text-center mb-1">Preview</div>
        <div
          className="h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded"
          style={{
            filter: `
              brightness(${newFilter.filter?.brightness || 100}%) 
              contrast(${newFilter.filter?.contrast || 100}%) 
              saturate(${newFilter.filter?.saturation || 100}%) 
              sepia(${newFilter.filter?.sepia || 0}%)
            `,
            opacity: `${(newFilter.filter?.opacity || 100) / 100}`,
          }}
        ></div>
      </div>

      {/* Saved Filters */}
      {filters.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Your Filters</h3>
          <p className="text-xs text-gray-500 mb-2">
            Click a filter to apply it. Click again to remove it.
          </p>
          <Separator className="mb-2" />
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {filters.map((filter) => (
                <Card
                  key={filter.id}
                  className={`cursor-pointer ${
                    selectedFilter?.id === filter.id
                      ? "border-primary bg-primary/5"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                  onClick={() => handleApplyFilter(filter)}
                >
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <CardTitle className="text-sm">{filter.name}</CardTitle>
                        {selectedFilter?.id === filter.id && (
                          <Check size={14} className="text-primary" />
                        )}
                      </div>
                      {!filter.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFilter(filter.id);
                          }}
                          disabled={deleteFilterMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div
                      className="h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded"
                      style={{
                        filter: `
                          brightness(${filter.filter?.brightness || 100}%) 
                          contrast(${filter.filter?.contrast || 100}%) 
                          saturate(${filter.filter?.saturation || 100}%) 
                          sepia(${filter.filter?.sepia || 0}%)
                        `,
                        opacity: `${(filter.filter?.opacity || 100) / 100}`,
                      }}
                    ></div>
                  </CardContent>
                </Card>
              ))}

              {/* Loading state */}
              {filtersLoading && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="animate-spin h-5 w-5 text-neutral-400" />
                </div>
              )}

              {/* Error state */}
              {filtersError && (
                <div className="text-center py-4 text-red-500 text-sm">
                  {typeof filtersError === "object" &&
                  filtersError !== null &&
                  "message" in filtersError
                    ? (filtersError as Error).message
                    : "An error occurred while loading filters"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;
