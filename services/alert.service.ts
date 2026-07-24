import api from "@/lib/axios";
import { Alert, ApiResponse } from "@/types";

// Query Params for GET /alerts
interface AlertQuery {
  page?: number;
  limit?: number;
  vehicleId?: string;
  alertType?: string;
  from?: string; // Date ISO string
  to?: string;
}

export const alertService = {
  // 1. Fetch Alerts (Real Endpoint)
  getAlerts: async (params?: AlertQuery): Promise<ApiResponse<Alert[]>> => {
    const { data } = await api.get("/alerts", { params });
    return data;
  },

  // 2. Delete Alert (Since there is no "Ack", we can offer "Delete" to clear it)
  deleteAlert: async (alertId: string): Promise<void> => {
    await api.delete(`/alerts/${alertId}`);
  },

  // 3. Create Alert (For testing purposes)
  createAlert: async (vehicleId: string, type: string) => {
    await api.post("/alerts", { vehicleId, alertType: type });
  },
};
