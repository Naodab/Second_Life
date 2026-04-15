import type { ProfileResponse } from "./profileResponse";

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  profile: ProfileResponse;
}
