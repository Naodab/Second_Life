import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";

export function UploadingModal({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm rounded-3xl text-center">
        <div className="py-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          </div>
          <div>
            <DialogDescription className="sr-only">Đang tải lên sản phẩm</DialogDescription>
            <h3 className="font-bold text-lg mb-2">Đang xử lý...</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hệ thống đang tải ảnh lên và phân tích để đề xuất giá phù hợp. Vui lòng chờ trong giây lát.
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
