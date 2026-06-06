import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApproveListing,
  adminListPendingListings,
  adminRejectListing,
} from "@/api/listing";
import { useToast } from "@/hooks/use-toast";
import { mapApiError } from "@/lib/api-error";

const PENDING_QUERY_KEY = ["admin", "listings", "pending"] as const;

export function usePendingListingsPage(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [...PENDING_QUERY_KEY, page, pageSize],
    queryFn: () => adminListPendingListings({ page, pageSize }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY });
  };

  const approveMutation = useMutation({
    mutationFn: adminApproveListing,
    onSuccess: () => {
      toast({ title: "Đã duyệt bài đăng" });
      invalidate();
    },
    onError: (err) => {
      const mapped = mapApiError(err);
      toast({ title: mapped.title, description: mapped.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminRejectListing,
    onSuccess: () => {
      toast({ title: "Đã từ chối bài đăng" });
      invalidate();
    },
    onError: (err) => {
      const mapped = mapApiError(err);
      toast({ title: mapped.title, description: mapped.message, variant: "destructive" });
    },
  });

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const actingId =
    approveMutation.isPending && approveMutation.variables
      ? approveMutation.variables
      : rejectMutation.isPending && rejectMutation.variables
        ? rejectMutation.variables
        : null;

  return {
    items,
    totalCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    actingId,
    isActing: approveMutation.isPending || rejectMutation.isPending,
  };
}
