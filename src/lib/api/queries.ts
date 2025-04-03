import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { SavedImage } from "@/app/store/imageStore";
import { Preset } from "@/app/store/presetStore";
import { useImageStore } from "@/app/store/imageStore";
import { Logo } from "@/app/services/logos.service";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
// User queries
export function useUserProfile() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => apiClient.get("/users/profile"),
  });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiClient.patch("/users/username", { username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

// Logo queries
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

// Image queries
export function useImages() {
  return useQuery({
    queryKey: ["images"],
    queryFn: () => apiClient.get("/images"),
  });
}

export function useImageById(id: string) {
  return useQuery({
    queryKey: ["images", id],
    queryFn: () => apiClient.get(`/images/${id}`),
    enabled: !!id,
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<SavedImage> => {
      return await apiClient.uploadFile<SavedImage>("images/upload", file);
    },
    onSuccess: (uploadedImage, _) => {
      // Update the Zustand store immediately
      const currentImages = useImageStore.getState().savedImages;
      useImageStore.setState({
        savedImages: [uploadedImage, ...currentImages],
      });

      // Invalidate both general images and user-specific images queries
    },
  });
}

// Typography queries
export function useTypographies() {
  return useQuery({
    queryKey: ["typographies"],
    queryFn: () => apiClient.get("/typography"),
  });
}

// Design queries
export function useDesigns() {
  return useQuery({
    queryKey: ["designs"],
    queryFn: () => apiClient.get("/designs"),
  });
}

export function useDesignById(id: string) {
  return useQuery({
    queryKey: ["designs", id],
    queryFn: () => apiClient.get(`/designs/${id}`),
    enabled: !!id,
  });
}

export function useCreateDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.post("/designs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
    },
  });
}

// ========================
// IMAGE QUERIES
// ========================

// Define a type for the image data structure
export interface ImageData {
  images: Array<{
    id: string;
    url: string;
    publicId?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
  }>;
  total: number;
}

// Fetch user images with proper typing
export function useUserImages(
  userId?: string,
  options?: Omit<
    UseQueryOptions<
      ImageData,
      Error,
      ImageData,
      readonly ["images", "user", string | undefined]
    >,
    "queryKey" | "queryFn" | "enabled"
  >
) {
  const queryClient = useQueryClient();

  return useQuery<
    ImageData,
    Error,
    ImageData,
    readonly ["images", "user", string | undefined]
  >({
    queryKey: ["images", "user", userId],
    queryFn: async () => {
      if (!userId) return { images: [], total: 0 };
      const response = await apiClient.get<{ images: any[]; total: number }>(
        `/images/user/${userId}`
      );

      if (response && response.images) {
        const mappedImages = {
          images: response.images.map((image) => ({
            id: image.id,
            url: image.url,
            publicId: image.publicId,
            filename: image.filename || image.publicId?.split("/").pop(),
            mimeType: image.mimeType,
            size: image.size,
            width: image.width,
            height: image.height,
          })),
          total: response.total,
        };

        // Update Zustand store with fresh data
        useImageStore.setState({ savedImages: mappedImages.images });
        return mappedImages;
      }
      return { images: [], total: 0 };
    },
    enabled: !!userId,
    refetchOnMount: true, // Refetch on component mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache the data (using gcTime instead of deprecated cacheTime)
    ...options,
  });
}

// Delete image mutation
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicId: string) => {
      console.log("Deleting image with ID/publicId:", publicId);

      if (publicId.includes("users/")) {
        const pathParts = publicId.split("/");
        const folderType = pathParts.length > 2 ? pathParts[2] : "images";
        return await apiClient.delete(
          `images/cloudinary/${encodeURIComponent(
            publicId
          )}?folder=${folderType}`
        );
      } else {
        return await apiClient.delete(`images/${publicId}`);
      }
    },
    onSuccess: async (_, deletedId) => {
      // Clear all image-related queries from the cache
      await queryClient.removeQueries({ queryKey: ["images"] });
      await queryClient.removeQueries({ queryKey: ["images", "user"] });

      // Update Zustand store
      const currentImages = useImageStore.getState().savedImages;
      useImageStore.setState({
        savedImages: currentImages.filter(
          (img) => img.id !== deletedId && img.publicId !== deletedId
        ),
      });

      // Force a refetch of the images
      await queryClient.invalidateQueries({ queryKey: ["images", "user"] });
    },
  });
}

// ========================
// LOGO QUERIES
// ========================

// Fetch cloudinary logos
export function useCloudinaryLogos(folder = "logos") {
  const queryClient = useQueryClient();

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

        // Fallback to general Cloudinary resources endpoint
        const response =
          await apiClient.getCloudinaryResources<CloudinaryResponse>(folder);

        // Convert Cloudinary resources to our Logo format
        const logos = response.resources.map((resource) => ({
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
  });
}

// Upload logo mutation
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      return await apiClient.uploadFile("/logos", file, { isDefault: false });
    },
    onSuccess: () => {
      // Invalidate logo queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}

// Delete logo mutation
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

// ========================
// PRESET QUERIES
// ========================

// Fetch cloudinary presets
export function useCloudinaryPresets(folder = "presets") {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["presets", "cloudinary", folder],
    queryFn: async () => {
      const url = `/presets?source=cloudinary&folder=${folder}&includeDefaults=true`;
      const response = await apiClient.get<any>(url);
      return response;
    },
    staleTime: 0,
    gcTime: 0,
  });
}

// Delete preset mutation
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

// Add this type
interface SaveDesign {
  id: string;
  imageUrl: string;
  name: string;
  filter?: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia: number;
    opacity: number;
  };
  textOverlay?: {
    text: string;
    isVisible: boolean;
    color: string;
    fontFamily: string;
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
  };
  logos?: Array<{
    url: string;
    position: { x: number; y: number };
    size: number;
  }>;
  aspectRatio: string;
}

export const useSaveDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (design: SaveDesign) => {
      const response = await apiClient.post<{ id: string; url: string }>(
        "designs",
        design
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate saved designs query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["saved-designs"] });
    },
  });
};

// Update useSavedDesigns to include better typing and error handling
export const useSavedDesigns = () => {
  return useQuery<SaveDesign[]>({
    queryKey: ["saved-designs"],
    queryFn: async () => {
      const response = await apiClient.get<SaveDesign[]>("designs");
      return response;
    },
  });
};

// Add a new mutation for deleting designs
export const useDeleteSavedDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (designId: string) => {
      const response = await apiClient.delete(`/designs/${designId}`);
      return response;
    },
    // Add optimistic update
    onMutate: async (designId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["saved-designs"] });

      // Snapshot the previous value
      const previousDesigns = queryClient.getQueryData<SaveDesign[]>([
        "saved-designs",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<SaveDesign[]>(["saved-designs"], (old) => {
        return (old || []).filter((design) => design.id !== designId);
      });

      return { previousDesigns };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, designId, context) => {
      queryClient.setQueryData(["saved-designs"], context?.previousDesigns);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete design. Please try again.",
      });
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-designs"] });
    },
  });
};
