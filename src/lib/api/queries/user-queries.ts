import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DefaultUserImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const cachedUserData =
    typeof window !== "undefined" ? localStorage.getItem("userData") : null;
  const parsedCachedData = cachedUserData ? JSON.parse(cachedUserData) : null;

  return useQuery<UserProfile>({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<UserProfile>("/users/profile");
        if (typeof window !== "undefined" && response) {
          localStorage.setItem("userData", JSON.stringify(response));
        }
        if (!response || !response.name) {
          console.warn(
            "User profile response is missing name property:",
            response
          );
        }
        return response;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
    },
    enabled: !!token,
    retry: 1,
    placeholderData: parsedCachedData,
    initialData:
      parsedCachedData ||
      ({
        id: "",
        name: "",
        email: "",
        image: null,
        createdAt: "",
        updatedAt: "",
      } as UserProfile),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });
}

export function useDefaultUserImage() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const cachedDefaultImage =
    typeof window !== "undefined"
      ? localStorage.getItem("defaultUserImage")
      : null;
  const parsedCachedImage = cachedDefaultImage
    ? JSON.parse(cachedDefaultImage)
    : null;

  return useQuery<DefaultUserImage>({
    queryKey: ["user", "defaults", "image"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<DefaultUserImage>(
          "/users/defaults/image"
        );
        if (typeof window !== "undefined" && response) {
          localStorage.setItem("defaultUserImage", JSON.stringify(response));
        }
        return response;
      } catch (error) {
        console.error("Error fetching default user image:", error);
        throw error;
      }
    },
    enabled: !!token,
    retry: 1,
    placeholderData: parsedCachedImage,
    initialData: parsedCachedImage || null,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
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
