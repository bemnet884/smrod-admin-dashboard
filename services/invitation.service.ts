import api from "@/lib/axios";

export interface CreateInvitationPayload {
  email?: string;
  phone?: string;
  role: "owner" | "manager" | "driver";
  vehicle_ids?: string[];
}

export interface RegisterFromInvitePayload {
  token: string;
  full_name: string;
  password: string;
}

export const invitationService = {
  // 1. Create the invitation (Admin/Owner action)
  async createInvitation(payload: any) {
    // Axios returns the full response object, we extract `.data` which is the JSON from the server
    const response = await api.post("/invitations", payload);
    return response.data;
  },
  // 2. Validate token (Used when user clicks the email link)
  async validateToken(token: string) {
    const { data } = await api.get(`/invitations/validate/${token}`);
    return data;
  },

  // 3. Complete registration
  async registerFromInvite(payload: RegisterFromInvitePayload) {
    const { data } = await api.post("/invitations/register", payload);
    return data;
  },
};
