import { userService } from "./user.service";

export const ownerService = {
  getOwners: (params?: { search?: string; page?: number; limit?: number }) =>
    userService.getUsers({ role: "owner", ...params }),
};
