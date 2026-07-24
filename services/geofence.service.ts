import api from "@/lib/axios";
import { ApiResponse } from "@/types";
export interface CreateGeofencePayload {
  name: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive?: boolean;
}

export const geofenceService = {
  getForVehicle: async (vehicleId: string): Promise<ApiResponse<any[]>> => {
    const { data } = await api.get(`/geofences/vehicle/${vehicleId}`);
    return data;
  },

  create: async (payload: CreateGeofencePayload) => {
    const { data } = await api.post("/geofences", payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateGeofencePayload>) => {
    const { data } = await api.patch(`/geofences/${id}`, payload);
    return data;
  },

  toggle: async (id: string, isActive: boolean) => {
    const { data } = await api.patch(`/geofences/${id}/toggle`, { isActive });
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/geofences/${id}`);
    return data;
  },
};
