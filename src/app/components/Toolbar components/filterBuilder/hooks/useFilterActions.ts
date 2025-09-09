import { useCallback } from "react";
import { Filter, FilterValues } from "@/app/store/filterStore";
import { useFilterStore } from "@/app/store/filterStore";
import { useImageStore } from "@/app/store/imageStore";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateFilter,
  useDeleteFilter,
} from "@/lib/api/queries/filter-queries";
import { FILTER_DEFAULTS } from "../constants/filterConfig";

export const useFilterActions = () => {
  const { toast } = useToast();
  const filterStore = useFilterStore();
  const { reset } = useImageStore();
  const createFilterMutation = useCreateFilter();
  const deleteFilterMutation = useDeleteFilter();

  const handleCreateFilter = useCallback(
    async (newFilter: { name: string; filter: FilterValues }) => {
      if (!newFilter.name) {
        toast({
          title: "Error",
          description: "Please enter a filter name",
          variant: "destructive",
        });
        return null;
      }

      try {
        const createdFilter = await createFilterMutation.mutateAsync(newFilter);
        toast({
          title: "Success",
          description: "Filter created successfully",
        });
        return createdFilter;
      } catch (error) {
        console.error("Error creating filter:", error);
        return null;
      }
    },
    [createFilterMutation, toast]
  );

  const handleDeleteFilter = useCallback(
    async (id: string) => {
      try {
        await deleteFilterMutation.mutateAsync(id);
        toast({
          title: "Success",
          description: "Filter deleted successfully",
        });
        return true;
      } catch (error) {
        console.error("Error deleting filter:", error);
        return false;
      }
    },
    [deleteFilterMutation, toast]
  );

  const handleApplyFilter = useCallback(
    (filter: Filter, selectedFilter: Filter | null) => {
      // Check if this filter is already selected
      if (selectedFilter?.id === filter.id) {
        // If clicking the selected filter, unselect it and reset to default values
        filterStore.setActiveFilter(null);
        reset();

        toast({
          title: "Filter Removed",
          description: `Filter '${filter.name}' has been removed`,
        });
        return null;
      } else {
        // Select the new filter
        filterStore.setActiveFilter(filter);

        toast({
          title: "Filter Applied",
          description: `Filter '${filter.name}' applied successfully`,
        });
        return filter;
      }
    },
    [filterStore, reset, toast]
  );

  const handleResetFilters = useCallback(() => {
    reset();
    filterStore.setActiveFilter(null);

    toast({
      title: "Filters Reset",
      description: "All filters have been reset to default values",
    });
  }, [reset, filterStore, toast]);

  return {
    handleCreateFilter,
    handleDeleteFilter,
    handleApplyFilter,
    handleResetFilters,
    isCreating: createFilterMutation.isPending,
    isDeleting: deleteFilterMutation.isPending,
    createError: createFilterMutation.error,
  };
};
