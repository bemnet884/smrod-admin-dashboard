// src/types/index.ts

import { number } from "zod";

// --- USER & AUTH ---
export type UserRole = "ADMIN" | "OWNER" | "MANAGER" | "DRIVER";
export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  isActive?: boolean; // Backend uses this
  phone?: string;
  avatarUrl?: string;
  createdAt: string;

  _count?: {
    subordinates?: number;
    vehicles?: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// --- DEVICES (Backend Structure) ---
export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: Status;
  lastSeen?: string;
  vehicleId?: string;
}

export interface Vehicle {
  id: string;
  name: string; // Backend 'name' (Make + Model)
  plateNumber: number; // Backend uses Integer
  type: VehicleType; // Enum from Prisma (CAR, TRUCK, etc.)
  description?: string | null;
  ownerId: string;
  speedLimit?: number; // Added to match backend root property
  createdAt: string;
  updatedAt: string;

  // Relations
  owner?: User;
  devices?: Device[];
  drivers?: User[];

  // Raw data arrays from GET /vehicles/:id
  telemetries?: any[]; // Array of telemetry objects
  alerts?: any[]; // Array of alert objects

  // Calculated analytics from backend admin/all endpoint
  statistics?: {
    totalDevices: number;
    totalTelemetry: number;
    totalAlerts: number;
  };

  // Prisma count object (often returned as _count)
  _count?: {
    devices: number;
    telemetries: number;
    alerts: number;
  };

  recentAlerts?: any[];

  // Transformed/Nested object for easy UI access
  latestTelemetry?: {
    id?: string;
    speed?: number;
    direction?: number;
    batteryLevel?: number;
    engineStatus?: boolean;
    doorStatus?: boolean;
    fuelLevel?: number;
    createdAt?: string;
    updatedAt?: string;
    gps?: { latitude: number; longitude: number }[];
  } | null;

  // UI State fields (Optional)
  status?: string;
  batteryLevel?: number;

  config?: {
    speedLimit: number;
    isEngineLocked: boolean;
    alertConfig?: {
      smsEnabled: boolean;
      callEnabled: boolean;
    };
  };

  // Legacy support for older components
  modules?: {
    passKey: boolean;
    tracking: boolean;
    governor: boolean;
  };
}
// --- DRIVER ASSIGNMENT ---
export interface DriverAssignment {
  vehicleId: string;
  driverId: string;
  permissions: {
    canDrive: boolean;
    timeWindow?: {
      start: string;
      end: string;
    };
    isTemporary: boolean;
    expiresAt?: string;
  };
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
}

// --- TELEMETRY ---
export interface TelemetryPoint {
  vehicleId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  ignition: boolean;
  orientation?: number;
}

// --- ALERTS ---
export type AlertType =
  | "ACCIDENT"
  | "THEFT"
  | "SLOW_DRIVING"
  | "FAST_DRIVING"
  | "SLOW_STOPPING"
  | "SLOW_STARTING"
  | "SLOW_TURNING"
  | "SLOW_BRAKING"
  | "SLOW_ACCELERATING"
  | "SLOW_DECELERATING"
  | "SLOW_CORNERING"
  | "SLOW_SIDEWAYS"
  | "GEOFENCE_BREACH"
  | "OTHER";

export type VehicleType =
  | "CAR"
  | "TRUCK"
  | "BUS"
  | "MOTORCYCLE"
  | "TRAILER"
  | "OTHER";

export interface Alert {
  id: string;
  vehicleId: string;
  type: AlertType;
  severity: "LOW" | "MEDIUM" | "CRITICAL";
  timestamp: string;
  message: string;
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED";
  location?: { lat: number; lng: number };
}

// --- API RESPONSE WRAPPER ---
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    page: number;
    total: number;
    totalDevices: number;
  };
}

export type Status = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DELETED";

export type SensorDevices =
  | "TELEMOTERY"
  | "ACCELEROMETER"
  | "GPS"
  | "TOUCH_SENSOR"
  | "DATA_BUFFER"
  | "CAMERA"
  | "ALCHOL_SENSOR"
  | "SPEED_SENSOR"
  | "FUEL_CUTTER"
  | "OTHER";