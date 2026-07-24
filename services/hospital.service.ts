import api from "@/lib/axios";
import { ApiResponse } from "@/types";

export interface Hospital {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt?: string;
}

export const hospitalService = {
  getHospitals: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<Hospital[]>> => {
    const { data } = await api.get("/hospitals", { params });
    return data;
  },

  getHospitalDetails: async (id: string): Promise<ApiResponse<Hospital>> => {
    const { data } = await api.get(`/hospitals/${id}`);
    return data;
  },

  createHospital: async (payload: Partial<Hospital>) => {
    const { data } = await api.post("/hospitals", payload);
    return data;
  },

  updateHospital: async (id: string, payload: Partial<Hospital>) => {
    const { data } = await api.patch(`/hospitals/${id}`, payload);
    return data;
  },

  toggleHospitalStatus: async (id: string): Promise<Hospital> => {
    const { data } = await api.patch(`/hospitals/${id}/toggle-status`);
    return data; // <-- must return the updated hospital object
  },
};
