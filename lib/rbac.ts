import { UserRole } from "@/types";

export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  DRIVER: "driver",
};

export const canAccess = (
  userRole: string | undefined,
  allowedRoles: string[]
) => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toLowerCase());
};
