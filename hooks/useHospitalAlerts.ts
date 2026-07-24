"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface AlertEvent {
  alertId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  distance: number;
  createdAt: string;
}

export function useHospitalAlerts(hospitalId?: string) {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!hospitalId) return;

    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setConnected(true);

      socket.emit("joinHospitalRoom", hospitalId);
    });

    socket.on("hospitalAlert", (data: AlertEvent) => {
      setAlerts((prev) => [data, ...prev]);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [hospitalId]);

  return { alerts, connected };
}
