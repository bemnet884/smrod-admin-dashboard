import api from "@/lib/axios";
import { AuthResponse } from "@/types";

export interface RegisterUserPayload {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  ownerId?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export const authService = {
  // Real Login
  async login(credentials: {
    email: string;
    password?: string;
  }): Promise<AuthResponse> {
    // 1. Map frontend 'email' to backend 'identifier'
    const payload = {
      identifier: credentials.email,
      password: credentials.password,
    };

    // 2. Make the request
    const response = await api.post("/auth/login", payload);
    const backendJson = response.data;

    // 3. Map backend response to our frontend AuthResponse structure
    return {
      accessToken: backendJson.data.access_token,
      refreshToken: backendJson.data.refresh_token || "",
      user: {
        id: backendJson.data.user.id,
        email: backendJson.data.user.email,
        name: backendJson.data.user.name,
        // Ensure role matches our frontend "ADMIN" type
        role: backendJson.data.user.role
          ? backendJson.data.user.role.toUpperCase()
          : "ADMIN",
        status: "ACTIVE", // Defaulting to active
        createdAt: new Date().toISOString(),
      },
    };
  },

  async registerUser(data: RegisterUserPayload): Promise<any> {
    const { data: response } = await api.post("/auth/register-direct", data);
    return response.data;
  },

  // Real Refresh Token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    return { accessToken: data.data?.access_token || data.accessToken };
  },

  // Real Owner Invitation
  async inviteOwner(email: string, name: string): Promise<void> {
    await api.post("/admin/owner-invite", { email, name });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/forgot-password", {
      identifier: email,
    });
  },

  // Step 2: Set the new password
  async resetPassword(password: string, token: string): Promise<void> {
    await api.post("/auth/reset-password", {
      password,
      token,
    });
  },

  // POST /auth/security-override
  async securityOverride(vehicleId: string, answer: string): Promise<any> {
    const { data } = await api.post("/auth/security-override", {
      vehicleId,
      answer,
    });
    return data;
  },
};
