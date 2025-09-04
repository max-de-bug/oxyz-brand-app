import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useCloudinaryPresets(folder = "presets") {
  const queryClient = useQueryClient();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery({
    queryKey: ["presets", "cloudinary", folder],
    queryFn: async () => {
      const url = `/presets?source=cloudinary&folder=${folder}&includeDefaults=true`;
      const response = await apiClient.get<any>(url);
      return response;
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !!token,
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/presets/${id}`);
    },
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ["presets"] });
      await queryClient.removeQueries({ queryKey: ["presets", "cloudinary"] });
      await queryClient.invalidateQueries({
        queryKey: ["presets", "cloudinary"],
      });
    },
  });
}
