import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

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
      const payload = {
        name: design.name,
        imageUrl: design.imageUrl,
        aspectRatio: design.aspectRatio,
        ...(design.filter &&
        Object.values(design.filter).some((val) => val !== undefined)
          ? { filter: design.filter }
          : {}),
        ...(design.textOverlay &&
        design.textOverlay.text &&
        design.textOverlay.color &&
        design.textOverlay.fontFamily
          ? { textOverlay: design.textOverlay }
          : {}),
        ...(design.logos && design.logos.length > 0
          ? { logos: design.logos }
          : {}),
      };

      console.log("Saving design with payload:", payload);
      const response = await apiClient.post<{ id: string; url: string }>(
        "designs",
        payload
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-designs"] });
    },
  });
};

export const useSavedDesigns = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  return useQuery<SaveDesign[]>({
    queryKey: ["saved-designs"],
    queryFn: async () => {
      const response = await apiClient.get<SaveDesign[]>("designs");
      return response;
    },
    enabled: !!token,
  });
};

export const useDeleteSavedDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (designId: string) => {
      const response = await apiClient.delete(`/designs/${designId}`);
      return response;
    },
    onMutate: async (designId) => {
      await queryClient.cancelQueries({ queryKey: ["saved-designs"] });
      const previousDesigns = queryClient.getQueryData<SaveDesign[]>([
        "saved-designs",
      ]);
      queryClient.setQueryData<SaveDesign[]>(["saved-designs"], (old) => {
        return (old || []).filter((design) => design.id !== designId);
      });
      return { previousDesigns } as { previousDesigns?: SaveDesign[] };
    },
    onError: (_err, _designId, context) => {
      queryClient.setQueryData(["saved-designs"], context?.previousDesigns);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete design. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-designs"] });
    },
  });
};
