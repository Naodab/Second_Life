import { useState } from "react";
import { Send, Store, Search, User, ChevronLeft, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MOCK_FACILITIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const FACILITY_CHATS = [
  {
    id: "sc1", facility: MOCK_FACILITIES[0],
    lastMessage: "Vâng, sản phẩm vẫn còn hàng cuối tuần này!",
    time: "10:30", unread: 2,
    messages: [
      { id: 1, from: "seller", text: "Xin chào! Bạn có quan tâm đến chiếc máy ảnh không?", time: "10:20" },
      { id: 2, from: "me", text: "Vâng, cuối tuần này còn hàng để thuê không ạ?", time: "10:25" },
      { id: 3, from: "seller", text: "Vâng, sản phẩm vẫn còn hàng cuối tuần này!", time: "10:30" },
    ]
  },
  {
    id: "sc2", facility: MOCK_FACILITIES[1],
    lastMessage: "Cảm ơn bạn đã thuê hàng, hẹn gặp lại!",
    time: "Hôm qua", unread: 0,
    messages: [
      { id: 1, from: "me", text: "Mình muốn hỏi về chiếc lều cắm trại, còn không ạ?", time: "09:00" },
      { id: 2, from: "seller", text: "Còn 2 chiếc bạn nhé! Bạn muốn thuê bao nhiêu ngày?", time: "09:05" },
      { id: 3, from: "me", text: "Mình thuê 3 ngày từ thứ 7 này nha.", time: "09:10" },
      { id: 4, from: "seller", text: "Cảm ơn bạn đã thuê hàng, hẹn gặp lại!", time: "09:30" },
    ]
  },
];

const CUSTOMER_CHATS = [
  {
    id: "cc1",
    buyerName: "Minh Trần",
    buyerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    facilityName: "Green Loop Store",
    lastMessage: "Bao giờ giao hàng được ạ?",
    time: "11:45", unread: 1,
    messages: [
      { id: 1, from: "customer", text: "Chào shop, mình vừa đặt chiếc ghế mây.", time: "11:30" },
      { id: 2, from: "me", text: "Xin chào! Mình đã nhận đơn, sẽ đóng gói và giao trong 1-2 ngày nhé.", time: "11:40" },
      { id: 3, from: "customer", text: "Bao giờ giao hàng được ạ?", time: "11:45" },
    ]
  },
  {
    id: "cc2",
    buyerName: "Linh Nguyễn",
    buyerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    facilityName: "Green Loop Store",
    lastMessage: "Oke shop, mình chờ nhe.",
    time: "Hôm qua", unread: 0,
    messages: [
      { id: 1, from: "customer", text: "Shop ơi, sản phẩm có còn không?", time: "08:00" },
      { id: 2, from: "me", text: "Còn bạn ơi, bạn muốn mua hay thuê?", time: "08:05" },
      { id: 3, from: "customer", text: "Mình muốn thuê 1 tuần.", time: "08:10" },
      { id: 4, from: "me", text: "Được nhé, bạn đặt lịch qua app nhé!", time: "08:15" },
      { id: 5, from: "customer", text: "Oke shop, mình chờ nhe.", time: "08:20" },
    ]
  },
  {
    id: "cc3",
    buyerName: "Hùng Phạm",
    buyerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    facilityName: "Green Loop Store",
    lastMessage: "Cảm ơn shop!",
    time: "2 ngày trước", unread: 0,
    messages: [
      { id: 1, from: "customer", text: "Sản phẩm đúng như mô tả, rất hài lòng!", time: "15:00" },
      { id: 2, from: "me", text: "Cảm ơn bạn đã ủng hộ shop nhé!", time: "15:10" },
      { id: 3, from: "customer", text: "Cảm ơn shop!", time: "15:12" },
    ]
  },
];

type TabType = "facilities" | "customers";

export default function Messages() {
  const [tab, setTab] = useState<TabType>("facilities");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<string, any[]>>({});

  const facilityChat = FACILITY_CHATS.find((c) => c.id === activeChat);
  const customerChat = CUSTOMER_CHATS.find((c) => c.id === activeChat);
  const currentChat = tab === "facilities" ? facilityChat : customerChat;
  const currentList = tab === "facilities" ? FACILITY_CHATS : CUSTOMER_CHATS;

  const handleSend = () => {
    if (!messageText.trim() || !activeChat) return;
    const msg = { id: Date.now(), from: "me", text: messageText, time: new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) };
    setLocalMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), msg] }));
    setMessageText("");
  };

  const getChatMessages = (chatId: string, baseMessages: any[]) => {
    return [...baseMessages, ...(localMessages[chatId] || [])];
  };

  const selectChat = (id: string) => { setActiveChat(id); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)]">
      <div className="bg-white rounded-3xl border shadow-sm h-full flex overflow-hidden">

        <div className={cn("w-full md:w-80 border-r flex flex-col flex-shrink-0", activeChat ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold font-display mb-4">Tin nhắn</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm..." className="pl-9 bg-gray-50 border-transparent rounded-full" />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => { setTab("facilities"); setActiveChat(null); }}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all", tab === "facilities" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <Store className="w-3.5 h-3.5" /> Với cơ sở
              </button>
              <button
                onClick={() => { setTab('customers'); setActiveChat(null); }}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all", tab === 'customers' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <User className="w-3.5 h-3.5" /> Với khách
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === "facilities" && (
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Cuộc trò chuyện với cơ sở</p>
              </div>
            )}
            {tab === 'customers' && (
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Khách nhắn cho cơ sở của bạn</p>
              </div>
            )}

            {currentList.map((chat: any) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={cn(
                  "px-4 py-3 border-b cursor-pointer flex gap-3 hover:bg-gray-50 transition-colors border-l-4",
                  activeChat === chat.id ? "bg-primary/5 border-l-primary" : "border-l-transparent"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-11 w-11 border">
                    <AvatarImage src={tab === "facilities" ? chat.facility.avatar : chat.buyerAvatar} />
                    <AvatarFallback>{tab === "facilities" ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback>
                  </Avatar>
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-semibold text-sm truncate">{tab === "facilities" ? chat.facility.name : chat.buyerName}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{chat.time}</span>
                  </div>
                  {tab === 'customers' && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{chat.facilityName}</span>
                    </div>
                  )}
                  <p className={cn("text-xs truncate", chat.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>{chat.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn("flex-1 flex flex-col min-w-0", !activeChat ? "hidden md:flex" : "flex")}>
          {currentChat ? (
            <>
              <div className="h-16 border-b px-4 flex items-center gap-3 flex-shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChat(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border flex-shrink-0">
                  <AvatarImage src={tab === "facilities" ? (currentChat as any).facility?.avatar : (currentChat as any).buyerAvatar} />
                  <AvatarFallback>{tab === "facilities" ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{tab === "facilities" ? (currentChat as any).facility?.name : (currentChat as any).buyerName}</h3>
                  {tab === 'customers' && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {(currentChat as any).facilityName}
                    </p>
                  )}
                  {tab === "facilities" && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Đang hoạt động
                    </p>
                  )}
                </div>
                {tab === "facilities" && (
                  <Badge variant="outline" className="ml-auto text-xs hidden sm:flex items-center gap-1">
                    <Store className="w-3 h-3" /> Cơ sở
                  </Badge>
                )}
                {tab === 'customers' && (
                  <Badge variant="outline" className="ml-auto text-xs hidden sm:flex items-center gap-1 bg-secondary/10 border-secondary/30">
                    <User className="w-3 h-3" /> Khách hàng
                  </Badge>
                )}
              </div>

              <div className="flex-1 bg-gray-50/50 p-4 overflow-y-auto space-y-3">
                <div className="flex justify-center mb-4">
                  <span className="bg-white border text-xs text-muted-foreground px-3 py-1 rounded-full">Hôm nay</span>
                </div>
                {getChatMessages(currentChat.id, currentChat.messages).map((msg: any) => (
                  <div key={msg.id} className={cn("flex gap-2", msg.from === 'me' ? "justify-end" : "")}>
                    {msg.from !== 'me' && (
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                        <AvatarImage src={tab === "facilities" ? (currentChat as any).facility?.avatar : (currentChat as any).buyerAvatar} />
                        <AvatarFallback className="text-xs">{msg.from === "seller" ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[70%]", msg.from === 'me' ? "items-end" : "items-start", "flex flex-col gap-1")}>
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        msg.from === 'me'
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white border rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 rounded-full border p-1 pl-4 focus-within:border-primary transition-colors">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="border-transparent bg-transparent shadow-none focus-visible:ring-0 px-0"
                  />
                  <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!messageText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                {tab === "facilities" ? <Store className="w-10 h-10 text-primary/50" /> : <User className="w-10 h-10 text-primary/50" />}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {tab === "facilities" ? "Tin nhắn với cơ sở" : "Tin nhắn từ khách hàng"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {tab === "facilities"
                  ? "Chọn một cuộc trò chuyện với cơ sở để tiếp tục."
                  : "Chọn một tin nhắn từ khách hàng để xem và trả lời."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
