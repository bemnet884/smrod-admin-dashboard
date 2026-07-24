import api from "@/lib/axios";
import { Vehicle, ApiResponse, User } from "@/types";


export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const vehicleService = {
  // 1. Smart Fetch: Calls the right endpoint based on role
  getVehicles: async (
    role?: string,
    params?: VehicleQueryParams
  ): Promise<ApiResponse<Vehicle[]>> => {
    const isAdmin = role?.toLowerCase() === "admin";
    const endpoint = isAdmin ? "/vehicles/admin/all" : "/vehicles";

    // Pass the params object directly to Axios
    const { data } = await api.get(endpoint, { params: params || {} });

    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map((v: any) => ({
        ...v,
        latestTelemetry: v.latestTelemetry || (v.telemetries?.[0] ?? null),
      }));
    }
    return data;
  },

  getAllVehiclesEnriched: async (
    params?: VehicleQueryParams
  ): Promise<ApiResponse<Vehicle[]>> => {
    const { data } = await api.get("/vehicles/admin/all", { params });
    return data;
  },
  // 3. Get Drivers Pool for assignment
  getAvailableDrivers: async (
    vehicleId: string,
    params?: VehicleQueryParams
  ): Promise<ApiResponse<User[]>> => {
    try {
      const { data } = await api.get(`/vehicles/${vehicleId}/drivers`, {
        params,
      });
      return data;
    } catch (error: any) {
      // If the specific "per-vehicle" driver endpoint fails,
      // we'll return an error so the UI can show a fallback
      throw error;
    }
  },

  // ... (keep other methods: registerVehicle, getVehicleById, sendCommand)
  registerVehicle: async (payload: any): Promise<Vehicle> => {
    const { data } = await api.post("/vehicles", payload);
    return data.data;
  },

  getVehicleById: async (
    id: string,
    params?: VehicleQueryParams
  ): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${id}`, { params });
    return data.data;
  },

  getDriversByOwner: async (
    ownerId: string,
    params?: VehicleQueryParams
  ): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get("/users", {
      params: {
        role: "driver",
        ownerId: ownerId, // This uses the filter built into your backend UsersService
        ...params,
      },
    });
    return data;
  },

  assignDriver: async (vehicleId: string, driverId: string): Promise<void> => {
    await api.post(`/vehicles/${vehicleId}/drivers`, { driverId });
  },

  sendCommand: async (vehicleId: string, command: string): Promise<void> => {
    await api.post(`/vehicles/${vehicleId}/command`, { action: command });
  },
};
