import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchListings, type ListingItemResponse, type ListingStatus } from "@/api/listing";
import type { FacilityWithPlaceNames } from "@/api/facility";

const PAGE_SIZE = 12;

export function ManageListingsView({
  facilities,
  onCreateListing,
}: {
  facilities: FacilityWithPlaceNames[];
  onCreateListing: (facilityId: string, productId?: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [facilityId, setFacilityId] = useState<string>("ALL");
  const [status, setStatus] = useState<"ALL" | ListingStatus>("ALL");
  const [rows, setRows] = useState<ListingItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const createFacilityId = useMemo(() => {
    if (facilityId !== "ALL") return facilityId;
    return facilities[0]?.id ?? "";
  }, [facilityId, facilities]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await searchListings({
          page,
          pageSize: PAGE_SIZE,
          keyword: keyword.trim() || undefined,
          facilityId: facilityId === "ALL" ? undefined : facilityId,
          listingStatus: status === "ALL" ? undefined : status,
        });
        if (!cancelled) setRows(data.items ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keyword, facilityId, status, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Listings</h2>
        <Button disabled={!createFacilityId} onClick={() => onCreateListing(createFacilityId)} className="rounded-full">
          <Plus className="w-4 h-4 mr-1.5" /> Tạo listing mới
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4 grid md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Tìm kiếm</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Facility</Label>
          <Select value={facilityId} onValueChange={setFacilityId}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              {facilities.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | ListingStatus)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="APPROVED">APPROVED</SelectItem>
              <SelectItem value="REJECTED">REJECTED</SelectItem>
              <SelectItem value="SOLD">SOLD</SelectItem>
              <SelectItem value="RENTED">RENTED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          <FileText className="mx-auto mb-2 w-8 h-8 opacity-40" />
          Chưa có listing
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((l) => (
            <div key={l.id} className="rounded-xl border p-3 bg-card">
              <p className="font-semibold line-clamp-2">{l.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{l.facilityName ?? "-"} · {l.listingStatus}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))}>Trước</Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Sau</Button>
      </div>
    </div>
  );
}
