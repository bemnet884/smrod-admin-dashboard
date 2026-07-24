import api from "@/lib/axios";

export const telemetryService = {
  // GET /telemetry/vehicles/{id}/latest
  getLatest: async (id: string) => {
    const { data } = await api.get(`/telemetry/vehicles/${id}/latest`);
    return data.data; // Ensure we go into the backend wrapper
  },
  // GET /telemetry/vehicles/{id}
  getHistory: async (id: string) => {
    const { data } = await api.get(`/telemetry/vehicles/${id}`);
    return data.data;
  },
};
