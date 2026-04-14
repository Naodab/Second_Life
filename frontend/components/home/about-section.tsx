import { Shield, Heart, Recycle, Users, Clock, BadgeCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Recycle,
    title: 'Mua sam ben vung',
    description: 'Chợ đồ cũ Second Life và giảm thiểu ô nhiễm môi trường. Mọi giao dịch đều giúp bảo vệ môi trường.'
  },
  {
    icon: Shield,
    title: 'Tin cay & An toan',
    description: 'Nguoi ban da xac minh, thanh toan an toan va bao ve nguoi mua trong moi giao dich.'
  },
  {
    icon: Clock,
    title: 'Thue linh hoat',
    description: 'Thue nhung gi ban can, khi ban can. Hoan hao cho su dung ngan han hoac thu truoc khi mua.'
  },
  {
    icon: BadgeCheck,
    title: 'Dam bao chat luong',
    description: 'Tat ca san pham duoc kiem tra va mo ta chinh xac. Ban nhan duoc dung nhung gi ban thay.'
  },
  {
    icon: Users,
    title: 'Cong dong gan ket',
    description: 'Tham gia cung hang ngan nguoi mua sam y thuc ve moi truong xay dung nen kinh te tuan hoan.'
  },
  {
    icon: Heart,
    title: 'Ho tro khach hang',
    description: 'Ho tro 24/7 de giup ban voi bat ky cau hoi hoac van de nao. Chung toi luon o day vi ban.'
  },
]

const policies = [
  {
    title: 'Quy dinh thue',
    items: [
      'Dat coc 30% cho tat ca don thue',
      'San pham phai tra lai trong tinh trang tuong tu',
      'Tra tre se chiu phi theo ngay',
      'Bao hiem hu hong co san'
    ]
  },
  {
    title: 'Bao ve nguoi mua',
    items: [
      'Hoan tien 100% neu san pham khong dung mo ta',
      '7 ngay doi tra cho hau het san pham',
      'Thanh toan ky quy an toan',
      'Ho tro giai quyet tranh chap'
    ]
  },
  {
    title: 'Quy tac cong dong',
    items: [
      'Trung thuc va chinh xac trong dang tin',
      'Giao tiep ton trong',
      'Hoan thanh giao dich tren nen tang',
      'Bao cao hoat dong dang ngo'
    ]
  },
]

export function AboutSection() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Features Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-3">Tai sao chon Second Life?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Chung toi lam cho viec mua va thue do cu tro nen de dang, an toan va ben vung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => (
            <Card key={feature.title} className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Policies */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-3">Chinh sach cua chung toi</h2>
          <p className="text-muted-foreground">
            Quy dinh ro rang de dam bao cho cho mot san giao dich an toan va cong bang cho tat ca moi nguoi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {policies.map((policy) => (
            <Card key={policy.title} className="rounded-2xl bg-background">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-primary">{policy.title}</h3>
                <ul className="space-y-3">
                  {policy.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '50K+', label: 'Nguoi dung' },
            { value: '100K+', label: 'San pham' },
            { value: '30K+', label: 'Luot thue thanh cong' },
            { value: '4.8', label: 'Danh gia trung binh' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
