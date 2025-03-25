import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: any }) =>
      apiClient.uploadFile("/images", file, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
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
