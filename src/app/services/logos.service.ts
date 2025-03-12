import { apiClient } from "../../lib/api-client";

export interface Logo {
  id: string;
  url: string;
  filename: string;
  userId: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LogosService = {
  /**
   * Get all logos for the current user
   */
  async getLogos(isDefault?: boolean): Promise<Logo[]> {
    const query = isDefault !== undefined ? `?isDefault=${isDefault}` : "";
    return apiClient.get<Logo[]>(`logos${query}`);
  },

  /**
   * Get a specific logo by ID
   */
  async getLogo(id: string): Promise<Logo> {
    return apiClient.get<Logo>(`logos/${id}`);
  },

  /**
   * Upload a new logo
   */
  async uploadLogo(file: File, isDefault?: boolean): Promise<Logo> {
    return apiClient.uploadFile<Logo>("logos", file, { isDefault });
  },

  /**
   * Delete a logo
   */
  async deleteLogo(id: string): Promise<void> {
    return apiClient.delete<void>(`logos/${id}`);
  },
};
