import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { guardSellerHubNavigation } from "@/components/SellerHubProfileGate";
import { SELLER_HUB_HOME } from "@/lib/seller-hub-paths";
import { Facebook, Instagram } from "lucide-react";

export function Footer() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, sellerHubProfileComplete } = useAuth();
  if (location.startsWith("/manage") || location.startsWith("/listings")) return null;

  return (
    <footer className="mt-20 border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary/20 p-2 rounded-xl">
                <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-display font-bold text-xl">Second Life</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Trao thêm giá trị cho đồ cũ. Mua, bán và thuê đồ dùng đã qua sử dụng an toàn và dễ dàng.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Chợ hàng</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/search?type=buy" className="hover:text-primary">Tất cả sản phẩm</Link></li>
              <li><Link href="/search?type=rent" className="hover:text-primary">Cho thuê</Link></li>
              <li><Link href="/search" className="hover:text-primary">Danh mục</Link></li>
              <li>
                <button
                  type="button"
                  className="hover:text-primary text-left"
                  onClick={() =>
                    guardSellerHubNavigation(
                      SELLER_HUB_HOME,
                      { isLoggedIn, sellerHubProfileComplete },
                      setLocation,
                    )
                  }
                >
                  Đăng bán
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Trung tâm hỗ trợ</a></li>
              <li><a href="#" className="hover:text-primary">Tin cậy & An toàn</a></li>
              <li><a href="#" className="hover:text-primary">Quy định thuê mượn</a></li>
              <li><a href="#" className="hover:text-primary">Liên hệ chúng tôi</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Pháp lý</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-primary">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-primary">Chính sách Cookie</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Second Life. Tất cả quyền được bảo lưu.</p>
          <div className="mt-4 md:mt-0 flex gap-4">
            <span>Việt Nam</span>
            <span>Tiếng Việt</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
