import { getProvinces, getWards } from "@/api/location";

export type FacilityPlaceNames = {
  provinceName: string;
  wardName: string;
};

export async function resolveFacilityPlaceNames(
  provinceCode: string,
  wardCode: string,
): Promise<FacilityPlaceNames> {
  const pc = provinceCode.trim();
  const wc = wardCode.trim();
  if (!pc) {
    return { provinceName: "", wardName: wc };
  }

  const [provinces, wards] = await Promise.all([
    getProvinces({ pageSize: 100 }),
    wc ? getWards({ provinceCode: pc, pageSize: 500 }) : Promise.resolve([]),
  ]);

  const province = provinces.find((p) => p.code === pc);
  const ward = wards.find((w) => w.code === wc);

  return {
    provinceName: province?.fullName?.trim() || province?.name?.trim() || pc,
    wardName: ward?.fullName?.trim() || ward?.name?.trim() || wc,
  };
}

export function formatWardProvinceLine(
  wardName?: string | null,
  provinceName?: string | null,
): string {
  return [wardName?.trim(), provinceName?.trim()].filter(Boolean).join(", ");
}

export function formatFacilityAddress(parts: {
  address?: string | null;
  wardName?: string | null;
  provinceName?: string | null;
  wardCode?: string | null;
  provinceCode?: string | null;
}): string {
  const line1 = parts.address?.trim() ?? "";
  const ward = (parts.wardName?.trim() || parts.wardCode?.trim()) ?? "";
  const province = (parts.provinceName?.trim() || parts.provinceCode?.trim()) ?? "";
  const locality = [ward, province].filter(Boolean).join(", ");
  return [line1, locality].filter(Boolean).join(", ");
}
