import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "../api-client";
import { SavedImage } from "@/app/store/imageStore";
import { Preset } from "@/app/store/presetStore";
import { useImageStore } from "@/app/store/imageStore";

// User queries
export function useUserProfile() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => apiClient.get("/users/profile"),
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
export function useCloudinaryLogos(
  folder = "logos",
  options?: UseQueryOptions
) {
  return useQuery({
    queryKey: ["logos", "cloudinary", folder],
    queryFn: async () => {
      try {
        const data = await apiClient.get<{
          resources: any[];
          next_cursor: string | null;
        }>(`/logos/cloudinary?folder=${folder}`);

        return data;
      } catch (endpointErr) {
        console.warn(
          "Endpoint-specific Cloudinary fetch failed, falling back to general resource fetch"
        );

        // Fallback to general Cloudinary resources endpoint
        const response = await apiClient.get<any>(
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
            isDefault:
              resource.public_id.includes("/defaults/") ||
              resource.tags?.includes("default") ||
              false,
            createdAt: resource.created_at,
            updatedAt: resource.created_at,
          })),
          next_cursor: response.next_cursor || null,
        };
      }
    },
    ...options,
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
    onSuccess: () => {
      // Invalidate logo queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["logos"] });
    },
  });
}

// ========================
// PRESET QUERIES
// ========================

// Fetch cloudinary presets
export function useCloudinaryPresets(
  folder = "presets",
  options?: UseQueryOptions
) {
  return useQuery({
    queryKey: ["presets", "cloudinary", folder],
    queryFn: async () => {
      console.log("Fetching Cloudinary presets...");

      // Use the correct URL with query parameters
      const url = `/presets?source=cloudinary&folder=${folder}&includeDefaults=true`;
      const response = await apiClient.get<any>(url);

      console.log("Cloudinary response:", response);

      // Check if the response has the expected structure
      if (!response || !response.resources) {
        console.error("Invalid response structure:", response);
        return { resources: [], next_cursor: null };
      }

      // Map Cloudinary resources to Preset format
      const cloudinaryPresets = response.resources
        .map((resource: any) => {
          try {
            // Extract filter values from context if available
            const filter = resource.context?.custom || {};

            // Use the id or publicId property, with fallbacks
            const identifier = resource.public_id || resource.public_id || "";
            const name =
              identifier.split("/").pop() ||
              resource.filename ||
              "Unnamed Preset";

            // Get the URL - prioritize the property that actually exists in your data
            const imageUrl = resource.url || resource.secure_url || "";

            return {
              id:
                resource.id ||
                `preset-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              name: name,
              filter: {
                brightness: parseFloat(filter.brightness) || 100,
                contrast: parseFloat(filter.contrast) || 100,
                saturation: parseFloat(filter.saturation) || 100,
                sepia: parseFloat(filter.sepia) || 0,
                opacity: parseFloat(filter.opacity) || 100,
              },
              isDefault:
                resource.isDefault ||
                resource.tags?.includes("default") ||
                false,
              createdAt:
                resource.created_at ||
                resource.created_at ||
                new Date().toISOString(),
              updatedAt:
                resource.updatedAt ||
                resource.created_at ||
                new Date().toISOString(),
              url: imageUrl, // Use the correctly extracted URL
              publicId: resource.public_id || resource.public_id || "",
            };
          } catch (err) {
            console.error("Error mapping resource:", resource, err);
            return null;
          }
        })
        .filter(Boolean);

      return {
        resources: cloudinaryPresets,
        next_cursor: response.next_cursor || null,
      };
    },
    ...options,
  });
}

// Delete preset mutation
export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/presets/${id}`);
    },
    onSuccess: () => {
      // Invalidate preset queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}
