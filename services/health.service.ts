import api from "@/lib/axios";

export interface SystemHealth {
  status: "ok" | "error" | "maintenance";
  info: any;
  timestamp: string;
}

export const healthService = {
  // Check if Backend + DB is alive
  checkSystemStatus: async (): Promise<SystemHealth> => {
    try {
      // Based on your Swagger docs
      const { data } = await api.get("/health/db");
      return { status: "ok", info: data, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: "error",
        info: null,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
