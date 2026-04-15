import * as zod from "zod";

export const HealthCheckResponse = zod.object({
  status: zod.string(),
});

export const LoginBody = zod.object({
  email: zod.string().email(),
  password: zod.string(),
});

export const loginResponseTokenTypeDefault = `Bearer`;

export const LoginResponse = zod.object({
  accessToken: zod.string(),
  refreshToken: zod.string(),
  tokenType: zod.string().default(loginResponseTokenTypeDefault),
  profile: zod.object({
    id: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
    email: zod.string(),
    phoneNumber: zod.string().optional(),
    avatarUrl: zod.string().optional(),
  }),
});

export const RefreshTokenBody = zod.object({
  refreshToken: zod.string(),
});

export const refreshTokenResponseTokenTypeDefault = `Bearer`;

export const RefreshTokenResponse = zod.object({
  accessToken: zod.string(),
  refreshToken: zod.string(),
  tokenType: zod.string().default(refreshTokenResponseTokenTypeDefault),
  profile: zod.object({
    id: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
    email: zod.string(),
    phoneNumber: zod.string().optional(),
    avatarUrl: zod.string().optional(),
  }),
});

export const GoogleOAuthCallbackQueryParams = zod.object({
  code: zod.coerce.string(),
  state: zod.coerce.string().optional(),
});

export const googleOAuthCallbackResponseTokenTypeDefault = `Bearer`;

export const GoogleOAuthCallbackResponse = zod.object({
  accessToken: zod.string(),
  refreshToken: zod.string(),
  tokenType: zod.string().default(googleOAuthCallbackResponseTokenTypeDefault),
  profile: zod.object({
    id: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
    email: zod.string(),
    phoneNumber: zod.string().optional(),
    avatarUrl: zod.string().optional(),
  }),
});

export const GetCurrentProfileResponse = zod.object({
  id: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
  email: zod.string(),
  phoneNumber: zod.string().optional(),
  avatarUrl: zod.string().optional(),
});
