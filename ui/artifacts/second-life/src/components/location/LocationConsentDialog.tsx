import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getWardsByLonLat } from "@/api/location";
import { approximateCoordsFromIp } from "@/lib/ip-geolocation";
import {
  isLocationConsentPromptDone,
  markLocationConsentPromptDone,
  persistVisitorLocation,
  type VisitorLocationPayload,
} from "@/lib/visitor-location";

type Props = {
  onResolved: () => void;
};

async function persistFromLonLat(lat: number, lon: number, source: VisitorLocationPayload["source"]) {
  const wards = await getWardsByLonLat(lon, lat);
  const first = wards[0];
  persistVisitorLocation({
    latitude: lat,
    longitude: lon,
    provinceCode: first?.province?.code?.trim() ?? null,
    wardCode: first?.code?.trim() ?? null,
    source,
  });
}

async function persistApproximateIpIfPossible() {
  const coords = await approximateCoordsFromIp();
  if (coords) await persistFromLonLat(coords.latitude, coords.longitude, "ip");
}

export function LocationConsentDialog({ onResolved }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLocationConsentPromptDone()) setOpen(true);
  }, []);

  const finishResolved = useCallback(() => {
    markLocationConsentPromptDone();
    setOpen(false);
    onResolved();
  }, [onResolved]);

  const handleAllowBrowser = () => {
    setBusy(true);
    if (!("geolocation" in navigator)) {
      persistApproximateIpIfPossible()
        .catch(() => undefined)
        .finally(() => {
          finishResolved();
          setBusy(false);
        });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          await persistFromLonLat(lat, lon, "browser");
        } catch {
          await persistApproximateIpIfPossible();
        }
        finishResolved();
        setBusy(false);
      },
      () => {
        persistApproximateIpIfPossible()
          .catch(() => undefined)
          .finally(() => {
            finishResolved();
            setBusy(false);
          });
      },
      { maximumAge: 60_000, timeout: 12_000, enableHighAccuracy: false },
    );
  };

  const handleDeny = () => {
    setBusy(true);
    persistApproximateIpIfPossible()
      .catch(() => undefined)
      .finally(() => {
        finishResolved();
        setBusy(false);
      });
  };

  if (!open) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent aria-describedby="location-consent-desc">
        <AlertDialogHeader>
          <AlertDialogTitle>Bật định vị cho gợi ý tin gần bạn?</AlertDialogTitle>
          <AlertDialogDescription id="location-consent-desc" className="text-left leading-relaxed">
            Chúng tôi dùng khu vực gần bạn và lịch sử tìm kiếm (khi đã đăng nhập và gửi mã định danh hồ sơ) để gợi ý tin đăng.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => handleDeny()} className="w-full sm:w-auto">
            Không
          </Button>
          <Button type="button" disabled={busy} onClick={() => handleAllowBrowser()} className="w-full sm:w-auto">
            Cho phép vị trí
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
