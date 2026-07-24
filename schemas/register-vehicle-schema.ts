import { z } from "zod";

export const registerVehicleSchema = z.object({
  plateNumber: z
    .string()
    .min(1, "Required")
    .regex(/^\d+$/, "Must be numbers only (Backend Limitation)"),

  make: z.string().min(2, "Required"),
  model: z.string().min(2, "Required"),

  ownerId: z.string().optional(),
  // Make it required string (can be empty string)
  vin: z.string(),

  passKey: z.boolean(),
  tracking: z.boolean(),
  governor: z.boolean(),
  type: z.enum(["CAR", "TRUCK", "BUS", "MOTORCYCLE", "TRAILER", "OTHER"]),
});

export type RegisterVehicleFormValues = z.infer<typeof registerVehicleSchema>;
