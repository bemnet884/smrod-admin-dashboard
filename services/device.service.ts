import api from "@/lib/axios";
import { ApiResponse, Device } from "@/types";

export const deviceService = {
  // Extract all hardware units from the fleet list
  getDevices: async (): Promise<ApiResponse<Device[]>> => {
    try {
      // Use the Enriched endpoint to get device details and lastSeen
      const { data: response } = await api.get("/vehicles/admin/all");
      const vehicles = response.data || [];

      const allDevices: any[] = [];

      vehicles.forEach((vehicle: any) => {
        if (vehicle.devices && Array.isArray(vehicle.devices)) {
          vehicle.devices.forEach((dev: any) => {
            allDevices.push({
              ...dev,
              // Attach vehicle info so we know where the device is installed
              vehiclePlate: vehicle.plateNumber,
              vehicleName: vehicle.name,
            });
          });
        }
      });

      return {
        success: true,
        data: allDevices,
      } as any;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to sync hardware registry"
      );
    }
  },

  // Stub for hardware activation if needed
  activateDevice: async (serialNumber: string) => {
    const { data } = await api.post("/vehicles/hardware-activate", {
      serialNumber,
    });
    return data;
  },
};
