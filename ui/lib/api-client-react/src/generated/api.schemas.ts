export interface HealthStatus {
  status: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  profile: ProfileResponse;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  profile: ProfileResponse;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export type GoogleOAuthCallbackParams = {
  code: string;
  state?: string;
};
