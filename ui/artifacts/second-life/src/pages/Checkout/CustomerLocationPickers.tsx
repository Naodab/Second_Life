import { useEffect, useState } from "react";
import { getProvinces, getWards, type ProvinceResponse, type WardResponse } from "@/api/location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  provinceCode: string;
  wardCode: string;
  onProvinceChange: (code: string) => void;
  onWardChange: (code: string) => void;
  disabled?: boolean;
  idPrefix: string;
  provinceLabel?: string;
  wardLabel?: string;
};

export function CustomerLocationPickers({
  provinceCode,
  wardCode,
  onProvinceChange,
  onWardChange,
  disabled,
  idPrefix,
  provinceLabel,
  wardLabel,
}: Props) {
  const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [loadProvinces, setLoadProvinces] = useState(false);
  const [loadWards, setLoadWards] = useState(false);
  const [provincesError, setProvincesError] = useState<string | null>(null);
  const [wardsError, setWardsError] = useState<string | null>(null);
  const [provincesReloadKey, setProvincesReloadKey] = useState(0);

  const province = (provinceCode ?? "").trim();
  const ward = (wardCode ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    setLoadProvinces(true);
    setProvincesError(null);
    void getProvinces({ pageSize: 100 })
      .then((list) => {
        if (!cancelled) setProvinces(list);
      })
      .catch(() => {
        if (!cancelled) {
          setProvinces([]);
          setProvincesError(
            "Không tải được danh sách tỉnh/thành. Kiểm tra location-service (docker compose) hoặc thử lại.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadProvinces(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provincesReloadKey]);

  useEffect(() => {
    if (!province) {
      setWards([]);
      setWardsError(null);
      return;
    }
    let cancelled = false;
    setLoadWards(true);
    setWardsError(null);
    void getWards({ provinceCode: province, pageSize: 500 })
      .then((list) => {
        if (!cancelled) setWards(list);
      })
      .catch(() => {
        if (!cancelled) {
          setWards([]);
          setWardsError("Không tải được phường/xã. Kiểm tra location-service hoặc thử lại.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadWards(false);
      });
    return () => {
      cancelled = true;
    };
  }, [province]);

  const showReadonlyFallback =
    disabled && Boolean(province || ward) && Boolean(provincesError || (province && wardsError));

  if (showReadonlyFallback) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block text-foreground">Tỉnh / Thành phố</label>
          <Input
            disabled
            className="h-11 rounded-xl bg-muted/25 text-foreground disabled:opacity-100"
            value={provinceLabel?.trim() || province}
            readOnly
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block text-foreground">Phường / Xã</label>
          <Input
            disabled
            className="h-11 rounded-xl bg-muted/25 text-foreground disabled:opacity-100"
            value={wardLabel?.trim() || ward}
            readOnly
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-province`} className="text-sm font-medium mb-1.5 block text-foreground">
            Tỉnh / Thành phố <span className="text-destructive">*</span>
          </label>
          <Select
            value={province || undefined}
            onValueChange={(code) => {
              onProvinceChange(code);
              onWardChange("");
            }}
            disabled={disabled || loadProvinces || Boolean(provincesError)}
          >
            <SelectTrigger id={`${idPrefix}-province`} className="h-11 rounded-xl w-full bg-muted/40">
              <SelectValue placeholder={loadProvinces ? "Đang tải…" : "Chọn tỉnh/thành"} />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.fullName || p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {provincesError ? <p className="text-xs text-destructive mt-1">{provincesError}</p> : null}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-ward`} className="text-sm font-medium mb-1.5 block text-foreground">
            Phường / Xã <span className="text-destructive">*</span>
          </label>
          <Select
            value={ward || undefined}
            onValueChange={onWardChange}
            disabled={disabled || !province || loadWards || Boolean(wardsError)}
          >
            <SelectTrigger id={`${idPrefix}-ward`} className="h-11 rounded-xl w-full bg-muted/40">
              <SelectValue placeholder={loadWards ? "Đang tải…" : "Chọn phường/xã"} />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w.code} value={w.code}>
                  {w.fullName || w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {wardsError ? <p className="text-xs text-destructive mt-1">{wardsError}</p> : null}
        </div>
      </div>
      {provincesError && !disabled ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setProvincesReloadKey((k) => k + 1)}
        >
          Thử tải lại tỉnh/thành
        </Button>
      ) : null}
    </div>
  );
}
