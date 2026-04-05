import { customFetch, getLoginUrl, login, refreshToken } from "@workspace/api-client-react";

export { login, refreshToken, getLoginUrl };

export function getRegisterUrl(): string {
  return getLoginUrl().replace(/\/login$/, "/register");
}

export async function registerWithEmailPassword(body: {
  email: string;
  password: string;
}): Promise<void> {
  await customFetch(getRegisterUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
