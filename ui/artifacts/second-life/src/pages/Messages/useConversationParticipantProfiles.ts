import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getProfileById, profileDisplayName, type ProfilePayload } from "@/api/profile";

export function useConversationParticipantProfiles(profileIds: string[]) {
  const profileIdsKey = profileIds.join("\0");
  const uniqueIds = useMemo(
    () => [...new Set(profileIdsKey.split("\0").map((id) => id.trim()).filter(Boolean))],
    [profileIdsKey],
  );

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["conversationParticipantProfile", id] as const,
      queryFn: () => getProfileById(id),
      enabled: Boolean(id),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const profileById = useMemo(() => {
    const map = new Map<string, ProfilePayload>();
    uniqueIds.forEach((id, index) => {
      const data = queries[index]?.data;
      if (data) map.set(id, data);
    });
    return map;
  }, [uniqueIds, queries]);

  const loading = queries.some((query) => query.isLoading);

  function displayName(profileId: string): string | null {
    const profile = profileById.get(profileId);
    return profile ? profileDisplayName(profile) : null;
  }

  function avatarUrl(profileId: string): string | null {
    return profileById.get(profileId)?.avatarUrl?.trim() ?? null;
  }

  return { profileById, loading, displayName, avatarUrl };
}
