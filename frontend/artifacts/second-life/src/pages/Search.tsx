import { useState } from "react";
import { useLocation } from "wouter";
import { Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-mock-api";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, PROVINCES } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function Search() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialType = searchParams.get('type') || 'all';
  const initialCategory = searchParams.get('category') || 'All';
  
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [catFilter, setCatFilter] = useState(initialCategory);
  
  const { data: products, isLoading } = useProducts(catFilter, typeFilter);

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
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0 hidden md:block">
            <div className="sticky top-28 space-y-8">
              
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> Bộ lọc
                </h3>
                
                <div className="space-y-6 bg-white p-5 rounded-2xl border shadow-sm">
                  {/* Listing Type */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Loại tin</h4>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant={typeFilter === 'all' ? 'default' : 'ghost'} 
                        className={`justify-start ${typeFilter === 'all' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                        onClick={() => setTypeFilter('all')}
                      >
                        Tất cả
                      </Button>
                      <Button 
                        variant={typeFilter === 'buy' ? 'default' : 'ghost'} 
                        className={`justify-start ${typeFilter === 'buy' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                        onClick={() => setTypeFilter('buy')}
                      >
                        Chỉ mua
                      </Button>
                      <Button 
                        variant={typeFilter === 'rent' ? 'default' : 'ghost'} 
                        className={`justify-start ${typeFilter === 'rent' ? 'bg-secondary/10 text-secondary-foreground hover:bg-secondary/20' : ''}`}
                        onClick={() => setTypeFilter('rent')}
                      >
                        Chỉ thuê
                      </Button>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Địa điểm</h4>
                    <Select>
                      <SelectTrigger className="w-full bg-gray-50 border-transparent">
                        <SelectValue placeholder="Tất cả tỉnh thành" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả tỉnh thành</SelectItem>
                        {PROVINCES.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Danh mục</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cat-all" 
                          checked={catFilter === 'All'}
                          onCheckedChange={() => setCatFilter('All')}
                        />
                        <label htmlFor="cat-all" className="text-sm font-medium leading-none cursor-pointer">
                          Tất cả danh mục
                        </label>
                      </div>
                      {CATEGORIES.map(cat => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`cat-${cat}`} 
                            checked={catFilter === cat}
                            onCheckedChange={() => setCatFilter(cat)}
                          />
                          <label htmlFor={`cat-${cat}`} className="text-sm leading-none cursor-pointer text-muted-foreground">
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Khoảng giá</h4>
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
          <main className="flex-1">
            <div className="bg-white p-4 rounded-2xl border shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display hidden md:block">
                  {catFilter === 'All' ? 'Tất cả sản phẩm' : catFilter}
                </h1>
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
                {[1, 2, 3, 4, 5, 6].map(i => (
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
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border">
                <img src={`${import.meta.env.BASE_URL}images/empty-cart.png`} alt="Không tìm thấy" className="w-48 h-48 mx-auto opacity-50 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground mb-6">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                <Button onClick={() => { setCatFilter('All'); setTypeFilter('all'); }}>Xóa bộ lọc</Button>
              </div>
            )}

            {products.length > 0 && !isLoading && (
              <div className="mt-12 flex justify-center">
                <div className="flex gap-2">
                  <Button variant="outline" disabled className="w-10 h-10 p-0 rounded-full border-transparent bg-white">1</Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">2</Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">3</Button>
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
