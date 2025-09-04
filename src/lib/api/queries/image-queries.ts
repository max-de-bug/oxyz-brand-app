import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useImageStore } from "@/app/store/imageStore";
import type { SavedImage } from "@/app/store/imageStore";

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
    onSuccess: (uploadedImage) => {
      const currentImages = useImageStore.getState().savedImages;

      if (Array.isArray(uploadedImage) && uploadedImage.length > 0) {
        useImageStore.setState({
          savedImages: [...uploadedImage, ...currentImages],
        });
        if (uploadedImage[0]?.url) {
          useImageStore.getState().setImage(uploadedImage[0].url);
        }
      } else if (uploadedImage?.url) {
        useImageStore.setState({
          savedImages: [uploadedImage, ...currentImages],
        });
        useImageStore.getState().setImage(uploadedImage.url);
      }
    },
  });
}

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
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

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

        useImageStore.setState({ savedImages: mappedImages.images });
        return mappedImages;
      }
      return { images: [], total: 0 };
    },
    enabled: !!userId && !!token,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    ...options,
  });
}

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
      await queryClient.removeQueries({ queryKey: ["images"] });
      await queryClient.removeQueries({ queryKey: ["images", "user"] });

      const currentImages = useImageStore.getState().savedImages;
      useImageStore.setState({
        savedImages: currentImages.filter(
          (img) => img.id !== deletedId && img.publicId !== deletedId
        ),
      });

      await queryClient.invalidateQueries({ queryKey: ["images", "user"] });
    },
  });
}
