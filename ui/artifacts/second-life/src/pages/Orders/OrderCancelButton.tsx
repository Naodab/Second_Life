import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";

import { cancelBookingOrder } from "@/api/booking";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mapApiError } from "@/lib/api-error";

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cancelMutation = useMutation({
    mutationFn: () => cancelBookingOrder(orderId),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["myBookingOrders"] });
      toast({
        title: "Đã hủy đơn hàng",
        description: "Đơn hàng đã được hủy thành công.",
      });
    },
    onError: (error) => {
      const view = mapApiError(error, {
        fallbackTitle: "Không thể hủy đơn",
        fallbackMessage: "Vui lòng thử lại sau.",
      });
      toast({
        variant: "destructive",
        title: view.title,
        description: view.message,
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <XCircle className="w-4 h-4 mr-2" /> Hủy đơn
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hủy đơn hàng?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn hủy đơn này? Hành động này không thể hoàn tác. Chỉ hủy được khi đơn
            đang chờ xác nhận.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>Không</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={cancelMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              cancelMutation.mutate();
            }}
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang hủy...
              </>
            ) : (
              "Xác nhận hủy"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
