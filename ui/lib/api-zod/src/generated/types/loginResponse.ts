import type { ProfileResponse } from "./profileResponse";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  profile: ProfileResponse;
}
