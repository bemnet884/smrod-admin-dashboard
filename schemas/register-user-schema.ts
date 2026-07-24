// schemas/register-user-schema.ts
import { z } from "zod";

export const userRoleEnum = z.enum(["driver", "manager"]);

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleEnum,
  securityQuestion: z.string().min(1, "Security question is required"),
  securityAnswer: z.string().min(1, "Security answer is required"),
});

export type RegisterUserFormValues = z.infer<typeof registerUserSchema>;
