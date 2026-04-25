import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-mock-api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getProvinces, ProvinceResponse, getWards, WardResponse } from "@/api/location";
import { LocationPickerCombobox } from "@/components/LocationPickerCombobox";
import { useCategories } from "@/hooks/use-categories";
import { buildFreshSearchPath } from "@/lib/search-url";

function readArrayParam(searchParams: URLSearchParams, key: string): string[] {
  const values = [...searchParams.getAll(`${key}[]`), ...searchParams.getAll(key)].filter(Boolean);
  return Array.from(new Set(values.map(String)));
}

export default function Search() {
  const [location, setLocation] = useLocation();
  const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [hoverCategoryId, setHoverCategoryId] = useState<string | null>(null);
  const [submenuPos, setSubmenuPos] = useState<{ top: number; left: number } | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: categories = [] } = useCategories();

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const openHoverMenu = (catId: string, anchorEl?: HTMLElement | null) => {
    clearHoverCloseTimer();
    setHoverCategoryId(catId);
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setSubmenuPos({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  };

  const scheduleCloseHoverMenu = (catId: string) => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      setHoverCategoryId((prev) => {
        if (prev === catId) {
          setSubmenuPos(null);
          return null;
        }
        return prev;
      });
    }, 180);
  };

  const parsedFilters = useMemo(() => {
    const query = location.includes("?") ? location.split("?")[1] ?? "" : "";
    const searchParams = new URLSearchParams(query);
    return {
      listingType: searchParams.get("listingType") || "all",
      categoryIds: readArrayParam(searchParams, "categoryIds"),
      subCategoryIds: readArrayParam(searchParams, "subCategoryIds"),
      provinceCode: searchParams.get("provinceCode") || undefined,
      wardCode: searchParams.get("WardCode") || searchParams.get("wardCode") || undefined,
    };
  }, [location]);

  const [typeFilter, setTypeFilter] = useState(parsedFilters.listingType);
  const [categoryIds, setCategoryIds] = useState<string[]>(parsedFilters.categoryIds);
  const [subCategoryIds, setSubCategoryIds] = useState<string[]>(parsedFilters.subCategoryIds);
  const [provinceCode, setProvinceCode] = useState<string | undefined>(parsedFilters.provinceCode);
  const [wardCode, setWardCode] = useState<string | undefined>(parsedFilters.wardCode);

  useEffect(() => {
    setTypeFilter(parsedFilters.listingType);
    setCategoryIds(parsedFilters.categoryIds);
    setSubCategoryIds(parsedFilters.subCategoryIds);
    setProvinceCode(parsedFilters.provinceCode);
    setWardCode(parsedFilters.wardCode);
  }, [parsedFilters]);

  useEffect(() => {
    getProvinces({}).then(setProvinces);
  }, []);

  useEffect(() => {
    if (provinceCode) {
      getWards({ provinceCode }).then(setWards);
    } else {
      setWards([]);
    }
  }, [provinceCode]);

  useEffect(() => {
    const nextPath = buildFreshSearchPath({
      listingType: typeFilter === "all" ? null : typeFilter,
      "categoryIds[]": categoryIds.length > 0 ? categoryIds : null,
      "subCategoryIds[]": subCategoryIds.length > 0 ? subCategoryIds : null,
      provinceCode: provinceCode ?? null,
      WardCode: wardCode ?? null,
    });

    if (nextPath !== location) {
      setLocation(nextPath);
    }
  }, [typeFilter, categoryIds, subCategoryIds, provinceCode, wardCode, location, setLocation]);

  useEffect(() => {
    return () => {
      clearHoverCloseTimer();
    };
  }, []);

  const selectedProvinceName = useMemo(() => {
    if (!provinceCode) return null;
    const province = provinces.find((item) => item.code === provinceCode);
    return province?.fullName || province?.name || null;
  }, [provinceCode, provinces]);

  const selectedWardName = useMemo(() => {
    if (!wardCode) return null;
    const ward = wards.find((item) => item.code === wardCode);
    return ward?.fullName || ward?.name || null;
  }, [wardCode, wards]);

  const { data: products, isLoading } = useProducts(
    subCategoryIds.length > 0 ? subCategoryIds : null,
    typeFilter,
    categoryIds.length > 0 ? categoryIds : null,
    selectedProvinceName,
    selectedWardName,
  );

  const categoryNameMap = useMemo(
    () => new Map(categories.map((cat) => [String(cat.id), cat.name])),
    [categories],
  );

  const selectedCategoryText = useMemo(() => {
    if (categoryIds.length === 0) return "Tất cả sản phẩm";
    if (categoryIds.length === 1) return categoryNameMap.get(categoryIds[0]) || "Danh mục";
    return `${categoryIds.length} danh mục`;
  }, [categoryIds, categoryNameMap]);

  const toggleCategory = (id: string, checked: boolean) => {
    setCategoryIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const toggleSubCategory = (id: string, checked: boolean) => {
    setSubCategoryIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle */}
        <div className="flex md:hidden items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-display">Khám phá</h1>
          <Button variant="outline" size="sm" className="bg-white">
            <Filter className="w-4 h-4 mr-2" /> Bộ lọc
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0 hidden md:block relative z-20">
            <div className="sticky top-28 relative z-20 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-visible pr-1 custom-scrollbar">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> Bộ lọc
                </h3>

                <div className="space-y-6 bg-white p-5 rounded-2xl border shadow-sm overflow-visible">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Loại tin
                    </h4>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="bg-gray-50 border-transparent">
                        <SelectValue placeholder="Chọn loại tin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="buy">Chỉ mua</SelectItem>
                        <SelectItem value="rent">Chỉ thuê</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Địa điểm
                    </h4>
                    <LocationPickerCombobox
                      items={provinces}
                      value={provinceCode}
                      onValueChange={(code) => {
                        setProvinceCode(code);
                        setWardCode(undefined);
                      }}
                      allLabel="Tất cả tỉnh thành"
                      searchPlaceholder="Tìm tỉnh thành..."
                      emptySearchText="Không tìm thấy tỉnh thành."
                    />
                    <LocationPickerCombobox
                      className="mt-2"
                      items={wards}
                      value={wardCode}
                      onValueChange={setWardCode}
                      disabled={!provinceCode}
                      allLabel="Tất cả xã phường"
                      searchPlaceholder={provinceCode ? "Tìm xã, phường..." : "Chọn tỉnh thành trước"}
                      emptySearchText={provinceCode ? "Không tìm thấy xã phường." : "Chọn tỉnh thành trước."}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Danh mục
                    </h4>
                    <div className="space-y-3 pr-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cat-all"
                          checked={categoryIds.length === 0 && subCategoryIds.length === 0}
                          onCheckedChange={() => {
                            setCategoryIds([]);
                            setSubCategoryIds([]);
                          }}
                        />
                        <label htmlFor="cat-all" className="text-sm font-medium leading-none cursor-pointer">
                          Tất cả danh mục
                        </label>
                      </div>

                      {categories.map((cat) => {
                        const catId = String(cat.id);
                        const subItems = cat.items || [];
                        const hasSubCategories = subItems.length > 0;
                        return (
                          <div
                            key={catId}
                            className="relative"
                            onMouseEnter={(event) => openHoverMenu(catId, event.currentTarget)}
                            onMouseLeave={() => scheduleCloseHoverMenu(catId)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <Checkbox
                                  id={`cat-${catId}`}
                                  checked={categoryIds.includes(catId)}
                                  onCheckedChange={(checked) => toggleCategory(catId, checked === true)}
                                />
                                <label
                                  htmlFor={`cat-${catId}`}
                                  className="text-sm leading-none cursor-pointer text-muted-foreground truncate"
                                >
                                  {cat.name}
                                </label>
                              </div>
                              {hasSubCategories && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>

                            {hasSubCategories &&
                              hoverCategoryId === catId &&
                              submenuPos &&
                              typeof document !== "undefined" &&
                              createPortal(
                                <div
                                  className="fixed z-[1400] min-w-56 rounded-xl border bg-white p-3 shadow-lg space-y-2"
                                  style={{ top: submenuPos.top, left: submenuPos.left }}
                                  onMouseEnter={() => openHoverMenu(catId)}
                                  onMouseLeave={() => scheduleCloseHoverMenu(catId)}
                                >
                                  {subItems.map((sub) => {
                                    const subId = String(sub.id);
                                    return (
                                      <div key={subId} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`sub-${catId}-${subId}`}
                                          checked={subCategoryIds.includes(subId)}
                                          onCheckedChange={(checked) =>
                                            toggleSubCategory(subId, checked === true)
                                          }
                                        />
                                        <label
                                          htmlFor={`sub-${catId}-${subId}`}
                                          className="text-sm leading-none cursor-pointer text-muted-foreground"
                                        >
                                          {sub.name}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>,
                                document.body,
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Khoảng giá
                    </h4>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Thấp nhất" className="bg-gray-50 border-transparent text-sm" />
                      <span className="text-muted-foreground">-</span>
                      <Input placeholder="Cao nhất" className="bg-gray-50 border-transparent text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 relative z-0">
            <div className="bg-white p-4 rounded-2xl border shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display hidden md:block">{selectedCategoryText}</h1>
                <p className="text-muted-foreground text-sm">{products.length} kết quả tìm thấy</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sắp xếp:</span>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 border-transparent">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                    <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                    <SelectItem value="distance">Gần nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border space-y-4">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border">
                <img
                  src={`${import.meta.env.BASE_URL}images/empty-cart.png`}
                  alt="Không tìm thấy"
                  className="w-48 h-48 mx-auto opacity-50 mb-4"
                />
                <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground mb-6">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                <Button
                  onClick={() => {
                    setCategoryIds([]);
                    setSubCategoryIds([]);
                    setTypeFilter("all");
                    setProvinceCode(undefined);
                    setWardCode(undefined);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {products.length > 0 && !isLoading && (
              <div className="mt-12 flex justify-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled
                    className="w-10 h-10 p-0 rounded-full border-transparent bg-white"
                  >
                    1
                  </Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
                    2
                  </Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
                    3
                  </Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
