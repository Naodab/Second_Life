import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, LayoutDashboard, LogOut, Package, Image as ImageIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Listings() {
  const [, setLocation] = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  const myProducts = MOCK_PRODUCTS.filter(p => p.shopId === 's1');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-xl">
            <img src={`${import.meta.env.BASE_URL}images/logo-leaf.png`} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-display font-bold text-xl">Quản lý bán hàng</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setLocation('/')}>
            <LayoutDashboard className="w-5 h-5 mr-3" /> Về trang chợ
          </Button>
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Quản lý</p>
          </div>
          <Button variant={activeTab === 'products' ? 'secondary' : 'ghost'} className={`w-full justify-start ${activeTab === 'products' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`} onClick={() => setActiveTab('products')}>
            <Package className="w-5 h-5 mr-3" /> Sản phẩm của tôi
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setActiveTab('stats')}>
            <BarChart3 className="w-5 h-5 mr-3" /> Doanh thu & Thống kê
          </Button>
        </nav>
        
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Green Loop Store</h1>
              <p className="text-muted-foreground mt-1">Quản lý kho hàng và lịch cho thuê của bạn.</p>
            </div>
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" /> Thêm sản phẩm mới
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Tổng sản phẩm đang bán</p>
              <p className="text-3xl font-bold">{myProducts.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Sản phẩm đang cho thuê</p>
              <p className="text-3xl font-bold text-secondary-foreground">2</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Doanh thu tháng này</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(4500000)}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold">Kho hàng</h2>
              <Input placeholder="Tìm sản phẩm..." className="max-w-xs bg-white rounded-full" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Sản phẩm</th>
                    <th className="px-6 py-4 font-medium">Loại</th>
                    <th className="px-6 py-4 font-medium">Giá</th>
                    <th className="px-6 py-4 font-medium">Kho / Trạng thái</th>
                    <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <img src={product.images[0]} className="w-12 h-12 rounded-lg object-cover border" />
                        <div className="font-semibold line-clamp-1 max-w-[200px]">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {product.type === 'buy' ? 'Mua' : product.type === 'rent' ? 'Thuê' : 'Mua & Thuê'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.buyPrice && <div className="text-primary font-medium">{formatCurrency(product.buyPrice)} <span className="text-[10px] text-muted-foreground font-normal">Mua</span></div>}
                        {product.rentPrice && <div className="text-secondary-foreground font-medium">{formatCurrency(product.rentPrice)} <span className="text-[10px] text-muted-foreground font-normal">/ngày Thuê</span></div>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none">Còn hàng</Badge>
                        <div className="text-xs text-muted-foreground mt-1">Kho: {product.stock}</div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" className="h-8">Chỉnh sửa</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Tên sản phẩm</label>
                <Input placeholder="Vd: Máy ảnh cổ điển" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Danh mục</label>
                <select className="w-full h-10 border rounded-md px-3 bg-white text-sm">
                  <option>Chọn danh mục</option>
                  <option>Điện tử</option>
                  <option>Nội thất</option>
                  <option>Quần áo</option>
                  <option>Sách</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Loại tin đăng</label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-primary/5 border-primary text-primary hover:bg-primary/10">Cả hai</Button>
                  <Button variant="outline" className="flex-1">Chỉ mua</Button>
                  <Button variant="outline" className="flex-1">Chỉ thuê</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Giá bán (VND)</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Giá thuê / Ngày (VND)</label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Hình ảnh</label>
                <div className="border-2 border-dashed rounded-2xl h-32 flex flex-col items-center justify-center text-muted-foreground hover:bg-gray-50 cursor-pointer transition-colors">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Nhấn để tải ảnh lên</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Mô tả</label>
                <textarea className="w-full border rounded-xl p-3 text-sm min-h-[120px] resize-none" placeholder="Mô tả tình trạng, thông số kỹ thuật..."></textarea>
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full">Hủy</Button>
            <Button onClick={() => setIsAddModalOpen(false)} className="rounded-full px-8 shadow-lg shadow-primary/20">Đăng tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
