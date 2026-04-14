import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createFacility,
  FACILITY_GOOGLE_MAP_LINK_MAX,
  facilityResponseToShop,
  type FacilityCreateBody,
} from "@/api/facility";
import { getProvinces, getWards, type ProvinceResponse, type WardResponse } from "@/api/location";
import type { Shop } from "@/lib/mock-data";

function inLength(s: string, min: number, max: number): boolean {
  const t = s.trim();
  return t.length >= min && t.length <= max;
}

function validateForm(f: {
  name: string;
  description: string;
  linkGoogleMap: string;
  address: string;
  provinceCode: string;
  wardCode: string;
}): string | null {
  if (!inLength(f.name, 3, 255)) return "Tên cơ sở: 3–255 ký tự.";
  if (f.description.trim().length > 1000) return "Mô tả tối đa 1000 ký tự.";
  if (!inLength(f.linkGoogleMap, 3, FACILITY_GOOGLE_MAP_LINK_MAX)) {
    return `Link Google Map: 3–${FACILITY_GOOGLE_MAP_LINK_MAX} ký tự (dán link đầy đủ từ trình duyệt).`;
  }
  if (!inLength(f.address, 3, 255)) return "Địa chỉ: 3–255 ký tự.";
  if (!f.provinceCode.trim()) return "Vui lòng chọn tỉnh/thành.";
  if (!f.wardCode.trim()) return "Vui lòng chọn phường/xã.";
  return null;
}

export function AddFacilityModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (shop: Shop) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    linkGoogleMap: "",
    address: "",
    provinceCode: "",
    wardCode: "",
  });
  const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [loadMeta, setLoadMeta] = useState(false);
  const [loadWards, setLoadWards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm({
      name: "",
      description: "",
      linkGoogleMap: "",
      address: "",
      provinceCode: "",
      wardCode: "",
    });
    setWards([]);
    setError(null);
    setLoadMeta(false);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadMeta(true);
    setError(null);

    (async () => {
      try {
        const provList = await getProvinces({ pageSize: 100 });
        if (cancelled) return;
        setProvinces(provList);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không tải được danh sách tỉnh/thành.");
        }
      } finally {
        if (!cancelled) setLoadMeta(false);
      }
    })();

    return () => {
      cancelled = true;
      setLoadMeta(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !form.provinceCode.trim()) {
      setWards([]);
      return;
    }

    let cancelled = false;
    setLoadWards(true);
    (async () => {
      try {
        const list = await getWards({ provinceCode: form.provinceCode, pageSize: 500 });
        if (!cancelled) setWards(list);
      } catch {
        if (!cancelled) setWards([]);
      } finally {
        if (!cancelled) setLoadWards(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, form.provinceCode]);

  const provinceLabel =
    provinces.find((p) => p.code === form.provinceCode)?.fullName ||
    provinces.find((p) => p.code === form.provinceCode)?.name ||
    form.provinceCode;
  const wardLabel =
    wards.find((w) => w.code === form.wardCode)?.fullName ||
    wards.find((w) => w.code === form.wardCode)?.name ||
    form.wardCode;

  /** Chỉ khóa khi đang tải tỉnh/thành hoặc đang gửi — validate chi tiết khi bấm Gửi (tránh nút “Tạo” mãi xám vì link dài / lỗi nhỏ). */
  const canSubmit = !loadMeta && !submitting;

  const handleSubmit = async () => {
    const v = validateForm(form);
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    const body: FacilityCreateBody = {
      name: form.name.trim(),
      linkGoogleMap: form.linkGoogleMap.trim(),
      address: form.address.trim(),
      provinceCode: form.provinceCode.trim(),
      wardCode: form.wardCode.trim(),
    };
    const desc = form.description.trim();
    if (desc) body.description = desc;
    try {
      const res = await createFacility(body);
      const shop = facilityResponseToShop(res, { provinceLabel, wardLabel });
      onCreated(shop);
      onClose();
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tạo cơ sở thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <DialogTitle className="text-xl font-display">Thêm cơ sở mới</DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            Chủ sở hữu được xác định theo tài khoản đăng nhập (header qua gateway).
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {loadMeta && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải danh mục địa phương…
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold mb-1.5 block">
                Tên cơ sở <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Vd: Green Loop Store Quận 1"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="rounded-xl"
                disabled={submitting}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold mb-1.5 block">Mô tả</label>
              <textarea
                className="w-full border rounded-xl p-3 text-sm min-h-[80px] resize-none"
                placeholder="Giới thiệu ngắn về cơ sở…"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold mb-1.5 block">
                Link Google Map <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="https://maps.app.goo.gl/…"
                value={form.linkGoogleMap}
                onChange={(e) => setField("linkGoogleMap", e.target.value)}
                className="rounded-xl"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Có thể dán link đầy đủ từ thanh địa chỉ (tối đa {FACILITY_GOOGLE_MAP_LINK_MAX} ký tự). Một số tham số theo dõi sẽ được bỏ tự động khi gửi.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold mb-1.5 block">
                Địa chỉ chi tiết <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Số nhà, đường…"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className="rounded-xl"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">
                Tỉnh / Thành phố <span className="text-destructive">*</span>
              </label>
              <Select
                value={form.provinceCode || undefined}
                onValueChange={(code) => {
                  setForm((prev) => ({ ...prev, provinceCode: code, wardCode: "" }));
                }}
                disabled={submitting || loadMeta}
              >
                <SelectTrigger className="rounded-xl w-full">
                  <SelectValue placeholder="Chọn tỉnh/thành" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.fullName || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">
                Phường / Xã <span className="text-destructive">*</span>
              </label>
              <Select
                value={form.wardCode || undefined}
                onValueChange={(code) => setField("wardCode", code)}
                disabled={submitting || !form.provinceCode || loadWards}
              >
                <SelectTrigger className="rounded-xl w-full">
                  <SelectValue
                    placeholder={loadWards ? "Đang tải…" : "Chọn phường/xã"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.fullName || w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
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
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className="rounded-full px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo…
              </>
            ) : (
              "Tạo cơ sở"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
