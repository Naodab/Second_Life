import Link from 'next/link'
import { Leaf, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl">Second Life</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cho do vat co hoi thu hai. Mua va thue hang chat luong 
              tu nhung nguoi ban dang tin cay trong cong dong cua ban.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-9 w-9 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                <Youtube className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Lien ket nhanh</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  Duyet san pham
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Danh muc
                </Link>
              </li>
              <li>
                <Link href="/my-listings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ban san pham
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cach hoat dong
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ve chung toi
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4">Chinh sach</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/policies/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Chinh sach bao mat
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dieu khoan dich vu
                </Link>
              </li>
              <li>
                <Link href="/policies/rental" className="text-muted-foreground hover:text-foreground transition-colors">
                  Quy dinh thue
                </Link>
              </li>
              <li>
                <Link href="/policies/trust" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tin cay & An toan
                </Link>
              </li>
              <li>
                <Link href="/policies/community" className="text-muted-foreground hover:text-foreground transition-colors">
                  Quy tac cong dong
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Lien he</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                support@secondlife.vn
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                1900-1234
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>123 Nguyen Hue, Quan 1, TP. Ho Chi Minh, Viet Nam</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>2026 Second Life. Ban quyen thuoc ve chung toi.</p>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-foreground transition-colors">
              Trung tam ho tro
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">
              Cau hoi thuong gap
            </Link>
            <Link href="/sitemap" className="hover:text-foreground transition-colors">
              So do trang
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
