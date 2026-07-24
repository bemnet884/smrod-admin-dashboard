import { userService } from "./user.service";

export const driverService = {
  getDrivers: (
    isOwner: boolean,
    params?: { search?: string; page?: number; limit?: number }
  ) => {
    if (isOwner) return userService.getMyStaff({ role: "driver", ...params });
    return userService.getUsers({ role: "driver", ...params });
  },
  toggleDriverStatus: (id: string, active: boolean) =>
    userService.updateUser(id, { isActive: active }),
  removeDriver: (id: string) => userService.deleteUser(id),
};
