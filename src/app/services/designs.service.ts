import { apiClient } from "@/lib/api-client";
import { PresetFilter, TextOverlay } from "../store/designStore";

export interface CreateDesignDto {
  name: string;
  imageId: string;
  logoId?: string;
  preset: PresetFilter;
  textOverlay: TextOverlay;
  position: {
    translationX: number;
    translationY: number;
    rotation: number;
    minSize: number;
    maxSize: number;
    spacing: number;
  };
}

export interface Design {
  id: string;
  name: string;
  imageId: string;
  logoId?: string;
  preset: PresetFilter;
  textOverlay: TextOverlay;
  position: {
    translationX: number;
    translationY: number;
    rotation: number;
    minSize: number;
    maxSize: number;
    spacing: number;
  };
  userId: string;
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
  source?: "database" | "cloudinary";
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
}

export const DesignsService = {
  /**
   * Get all designs for the current user
   */
  async getDesigns(collectionId?: string): Promise<Design[]> {
    const query = collectionId ? `?collection=${collectionId}` : "";
    return apiClient.get<Design[]>(`designs${query}`);
  },

  /**
   * Get a specific design by ID
   */
  async getDesign(id: string): Promise<Design> {
    return apiClient.get<Design>(`designs/${id}`);
  },

  /**
   * Create a new design
   */
  async createDesign(design: CreateDesignDto): Promise<Design> {
    return apiClient.post<Design>("designs", design);
  },

  /**
   * Update an existing design
   */
  async updateDesign(
    id: string,
    design: Partial<CreateDesignDto>
  ): Promise<Design> {
    return apiClient.put<Design>(`designs/${id}`, design);
  },

  /**
   * Delete a design
   */
  async deleteDesign(id: string): Promise<void> {
    return apiClient.delete<void>(`designs/${id}`);
  },

  /**
   * Export a design
   */
  async exportDesign(id: string, exportOptions: any): Promise<{ url: string }> {
    return apiClient.post<{ url: string }>(
      `designs/${id}/export`,
      exportOptions
    );
  },
};
