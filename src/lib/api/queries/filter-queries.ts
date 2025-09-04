import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { Filter, FilterValues } from "@/app/store/filterStore";

export function useFilters() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery<Filter[]>({
    queryKey: ["filters"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Filter[]>("/filters");
        return response;
      } catch (error) {
        console.error("Error fetching filters:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!token,
  });
}

export function useFilterById(id: string) {
  return useQuery<Filter>({
    queryKey: ["filters", id],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Filter>(`/filters/${id}`);
        return response;
      } catch (error) {
        console.error(`Error fetching filter with ID ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filterData: {
      name: string;
      filter: FilterValues;
    }): Promise<Filter> => {
      try {
        const response = await apiClient.post<Filter>("/filters", filterData);
        return response;
      } catch (error) {
        console.error("Error creating filter:", error);
        throw error;
      }
    },
    onSuccess: (newFilter) => {
      console.log("Mutation succeeded with filter:", newFilter);
      queryClient.setQueryData<Filter[]>(["filters"], (oldFilters = []) => {
        return [...oldFilters, newFilter];
      });
      queryClient.invalidateQueries({ queryKey: ["filters"] });
      toast({ title: "Success", description: "Filter created successfully" });
    },
    onError: (error) => {
      console.error("Failed to create filter:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create filter. Please try again.",
      });
    },
    retry: 0,
  });
}

export function useDeleteFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filterId: string) => {
      try {
        return await apiClient.delete(`/filters/${filterId}`);
      } catch (error) {
        console.error(`Error deleting filter with ID ${filterId}:`, error);
        throw error;
      }
    },
    onMutate: async (filterId) => {
      await queryClient.cancelQueries({ queryKey: ["filters"] });
      const previousFilters = queryClient.getQueryData<Filter[]>(["filters"]);
      queryClient.setQueryData<Filter[]>(["filters"], (old) => {
        return (old || []).filter((filter) => filter.id !== filterId);
      });
      return { previousFilters } as { previousFilters?: Filter[] };
    },
    onError: (err, _filterId, context) => {
      queryClient.setQueryData(["filters"], context?.previousFilters);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete filter. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
    },
  });
}
