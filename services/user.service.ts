import api from "@/lib/axios";
import { User, ApiResponse } from "@/types";

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "admin" | "owner" | "manager" | "driver";
  isActive?: boolean;
  ownerId?: string;
}

export const userService = {
  // GET /users (Maps to findAll)
  getUsers: async (params: UserQueryParams): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get("/users", { params });
    return data;
  },

  // GET /users/:id (Maps to findOne)
  // This returns vehicles and subordinates too!
  getUserDetails: async (id: string): Promise<ApiResponse<User>> => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  // PATCH /users/:id (Maps to update)
  updateUser: async (
    id: string,
    payload: Partial<User>
  ): Promise<ApiResponse<User>> => {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  },

  // DELETE /users/:id (Maps to remove)
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  // POST /users/change-password (Maps to changePassword)
  changePassword: async (payload: any): Promise<{ message: string }> => {
    const { data } = await api.post("/users/change-password", payload);
    return data;
  },

  // GET /users/subordinates (Maps to getSubordinates)
  // Useful for Owners to see ONLY their staff
  getMyStaff: async (params: UserQueryParams): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get("/users/subordinates", { params });
    return data;
  },
};
