import { useRef, useState, type ChangeEvent } from "react";
import {
  Plus,
  Image as ImageIcon,
  Video,
  X,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AddProductSubmitPayload } from "./types";

export function AddProductModal({
  open,
  facilityId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  facilityId: string;
  onClose: () => void;
  onSubmit: (data: AddProductSubmitPayload) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "",
    material: "",
    forRent: false,
    forBuy: false,
    rentQty: 1,
    buyQty: 1,
    totalQty: 1,
    coverFile: null as File | null,
    coverPreview: "",
    otherFiles: [] as { name: string; preview: string; type: string }[],
  });
  const coverRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const setField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setField("coverFile", file);
    setField("coverPreview", url);
  };

  const handleOtherFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - form.otherFiles.length;
    files.slice(0, remaining).forEach((f) => {
      const url = URL.createObjectURL(f);
      setForm((prev) => ({
        ...prev,
        otherFiles: [...prev.otherFiles, { name: f.name, preview: f.type.startsWith("video") ? "" : url, type: f.type }],
      }));
    });
  };

  const removeOtherFile = (i: number) =>
    setForm((prev) => ({ ...prev, otherFiles: prev.otherFiles.filter((_, idx) => idx !== i) }));

  const canSubmit = form.name.trim() && (form.forRent || form.forBuy);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: form.name,
      description: form.description,
      color: form.color,
      material: form.material,
      forRent: form.forRent,
      forBuy: form.forBuy,
      rentQty: form.rentQty,
      buyQty: form.buyQty,
      totalQty: form.totalQty,
      facilityId,
      previewUrl:
        form.coverPreview || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    });
  };

  const reset = () =>
    setForm({
      name: "",
      description: "",
      color: "",
      material: "",
      forRent: false,
      forBuy: false,
      rentQty: 1,
      buyQty: 1,
      totalQty: 1,
      coverFile: null,
      coverPreview: "",
      otherFiles: [],
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Thêm mặt hàng mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">
                Tên sản phẩm <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Vd: Máy ảnh cổ điển"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Màu sắc</label>
              <Input
                placeholder="Vd: Đen, Trắng, Xanh"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Chất liệu</label>
              <Input
                placeholder="Vd: Nhựa, Kim loại, Gỗ"
                value={form.material}
                onChange={(e) => setField("material", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">Mô tả</label>
            <textarea
              className="w-full border rounded-xl p-3 text-sm min-h-[80px] resize-none"
              placeholder="Mô tả tình trạng, thông số kỹ thuật..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">
              Hình thức <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.forRent} onCheckedChange={(v) => setField("forRent", Boolean(v))} />
                <span className="text-sm font-medium">Cho thuê</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.forBuy} onCheckedChange={(v) => setField("forBuy", Boolean(v))} />
                <span className="text-sm font-medium">Mua bán</span>
              </label>
            </div>
          </div>

          {(form.forRent || form.forBuy) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {form.forRent && form.forBuy ? (
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Số lượng tổng</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.totalQty}
                    onChange={(e) => setField("totalQty", Number(e.target.value))}
                    className="w-28 rounded-xl h-9"
                  />
                </div>
              ) : (
                <>
                  {form.forRent && (
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Số lượng cho thuê</label>
                      <Input
                        type="number"
                        min={1}
                        value={form.rentQty}
                        onChange={(e) => setField("rentQty", Number(e.target.value))}
                        className="w-28 rounded-xl h-9"
                      />
                    </div>
                  )}
                  {form.forBuy && (
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Số lượng mua bán</label>
                      <Input
                        type="number"
                        min={1}
                        value={form.buyQty}
                        onChange={(e) => setField("buyQty", Number(e.target.value))}
                        className="w-28 rounded-xl h-9"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Ảnh bìa (ảnh chính)</label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              <div
                role="button"
                tabIndex={0}
                onClick={() => coverRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && coverRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 aspect-video overflow-hidden",
                  form.coverPreview ? "border-primary/40" : "border-gray-300"
                )}
              >
                {form.coverPreview ? (
                  <img src={form.coverPreview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground py-6">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-xs">Nhấn để tải ảnh bìa</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                Ảnh & Video khác
                <span className="text-xs text-muted-foreground font-normal">({form.otherFiles.length}/10)</span>
              </label>
              <input
                ref={otherRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleOtherFiles}
              />
              <div className="grid grid-cols-3 gap-2">
                {form.otherFiles.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                    {f.type.startsWith("video") ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                        <Video className="w-6 h-6" />
                      </div>
                    ) : (
                      <img src={f.preview} className="w-full h-full object-cover" alt="" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeOtherFile(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {form.otherFiles.length < 10 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => otherRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && otherRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {!canSubmit && form.name && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Vui lòng chọn ít nhất một hình thức (cho thuê hoặc mua bán).</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              reset();
            }}
            className="rounded-full"
          >
            Hủy
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit} className="rounded-full px-8">
            Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
