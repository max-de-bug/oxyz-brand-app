import { apiClient } from "../../lib/api-client";

export interface Image {
  id: string;
  url: string;
  filename: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const ImagesService = {
  /**
   * Get all images for the current user
   */
  async getImages(): Promise<Image[]> {
    return apiClient.get<Image[]>("images");
  },

  /**
   * Get a specific image by ID
   */
  async getImage(id: string): Promise<Image> {
    return apiClient.get<Image>(`images/${id}`);
  },

  /**
   * Upload a new image
   */
  async uploadImage(file: File): Promise<Image> {
    return apiClient.uploadFile<Image>("images", file);
  },

  /**
   * Delete an image
   */
  async deleteImage(id: string): Promise<void> {
    return apiClient.delete<void>(`images/${id}`);
  },
};
