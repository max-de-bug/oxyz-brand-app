import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Logo {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  publicId?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CloudinaryResponse {
  resources: Logo[];
  next_cursor: string | null;
}

// Query hooks
export function useLogos() {
  return useQuery({
    queryKey: ["logos"],
    queryFn: () => apiClient.get<Logo[]>("/logos"),
  });
}

export function useCloudinaryLogos(folder = "logos") {
  return useQuery({
    queryKey: ["cloudinaryLogos", folder],
    queryFn: async () => {
      try {
        return await apiClient.get<CloudinaryResponse>(
          `/logos/cloudinary?folder=${folder}`
        );
      } catch (endpointErr) {
        // Fallback to general Cloudinary resources endpoint
        const response = await apiClient.get<CloudinaryResponse>(
          `/cloudinary/resources?folder=${folder}`
        );
        return {
          resources: response.resources.map((resource: any) => ({
            id: resource.public_id,
            url: resource.secure_url,
            filename: resource.public_id.split("/").pop() || resource.public_id,
            mimeType: `image/${resource.format}`,
            size: resource.bytes,
            width: resource.width,
            height: resource.height,
            publicId: resource.public_id,
            isDefault: resource.tags?.includes("default") || false,
            createdAt: resource.created_at,
            updatedAt: resource.created_at,
          })),
          next_cursor: response.next_cursor || null,
        };
      }
    },
  });
}

// Mutation hooks
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }
      return apiClient.uploadFile("/logos", file, { isDefault: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}

export function useSetDefaultLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logoId: string) =>
      apiClient.put(`/logos/${logoId}`, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logoId: string) => apiClient.delete(`/logos/${logoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}
