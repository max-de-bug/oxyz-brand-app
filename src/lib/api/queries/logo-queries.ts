import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Define interfaces locally
export interface Logo {
  id: string;
  url: string;
  filename: string;
  userId: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CloudinaryResponse {
  resources: any[];
  next_cursor?: string | null;
}

export function useLogos() {
  return useQuery({
    queryKey: ["logos"],
    queryFn: () => apiClient.get("/logos"),
  });
}

export function useLogoById(id: string) {
  return useQuery({
    queryKey: ["logos", id],
    queryFn: () => apiClient.get(`/logos/${id}`),
    enabled: !!id,
  });
}

export function useCreateLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post("/logos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}

export function useCloudinaryLogos(folder = "logos") {
  const queryClient = useQueryClient();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery({
    queryKey: ["logos", "cloudinary", folder],
    queryFn: async () => {
      try {
        const data = await apiClient.getFromCloudinary<{
          resources: Logo[];
          next_cursor: string | null;
        }>("/logos", folder);
        console.log("data", data);
        return data;
      } catch (endpointErr) {
        console.warn(
          "Endpoint-specific Cloudinary fetch failed, falling back to general resource fetch"
        );

        const response =
          await apiClient.getCloudinaryResources<CloudinaryResponse>(folder);

        const logos = response.resources.map((resource: any) => ({
          id: resource.public_id,
          url: resource.secure_url,
          filename: resource.public_id.split("/").pop() || resource.public_id,
          mimeType: `image/${resource.format}`,
          size: resource.bytes,
          width: resource.width,
          height: resource.height,
          publicId: resource.public_id,
          isDefault:
            resource.public_id.includes("/defaults/") ||
            resource.tags?.includes("default") ||
            false,
          createdAt: resource.created_at,
          updatedAt: resource.created_at,
        }));

        return {
          resources: logos,
          next_cursor: response.next_cursor || null,
        };
      }
    },
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!token,
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      return await apiClient.uploadFile("/logos", file, { isDefault: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/logos/${id}`);
    },
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: ["logos"] });
      await queryClient.removeQueries({ queryKey: ["logos", "cloudinary"] });
      await queryClient.invalidateQueries({
        queryKey: ["logos", "cloudinary"],
      });
    },
  });
}
