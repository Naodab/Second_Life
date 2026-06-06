import { useQuery } from "@tanstack/react-query";
import { adminListAccounts, type AdminAccountRole } from "@/api/admin";

export function useAdminUsersPage(
  page: number,
  pageSize: number,
  keyword: string,
  accountRole: "ALL" | AdminAccountRole,
  emailVerified: "ALL" | "true" | "false",
) {
  return useQuery({
    queryKey: ["admin", "users", page, pageSize, keyword, accountRole, emailVerified],
    queryFn: () =>
      adminListAccounts({
        page,
        pageSize,
        keyword: keyword || undefined,
        accountRole: accountRole === "ALL" ? undefined : accountRole,
        emailVerified:
          emailVerified === "ALL" ? undefined : emailVerified === "true",
      }),
  });
}
