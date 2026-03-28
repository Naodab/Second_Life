import { useState } from "react";
import { Send, Store, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_SHOPS } from "@/lib/mock-data";

const MOCK_CHATS = [
  { id: '1', shop: MOCK_SHOPS[0], lastMessage: "Vâng, sản phẩm vẫn còn hàng!", time: "10:30", unread: 2 },
  { id: '2', shop: MOCK_SHOPS[1], lastMessage: "Cảm ơn bạn đã thuê hàng.", time: "Hôm qua", unread: 0 },
];

export default function Messages() {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const currentChat = MOCK_CHATS.find(c => c.id === activeChat);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)]">
      <div className="bg-white rounded-3xl border shadow-sm h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold font-display mb-4">Tin nhắn</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm tin nhắn..." className="pl-9 bg-gray-50 border-transparent rounded-full" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {MOCK_CHATS.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`p-4 border-b cursor-pointer flex gap-3 hover:bg-gray-50 transition-colors ${activeChat === chat.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
              >
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={chat.shop.avatar} />
                  <AvatarFallback><Store className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm truncate">{chat.shop.name}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat && currentChat ? (
            <>
              <div className="h-16 border-b px-6 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setActiveChat(null)}>
                  <Store className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={currentChat.shop.avatar} />
                </Avatar>
                <div>
                  <h3 className="font-bold">{currentChat.shop.name}</h3>
                  <p className="text-xs text-primary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span> Đang hoạt động
                  </p>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-50/50 p-6 overflow-y-auto space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-white border text-xs text-muted-foreground px-3 py-1 rounded-full">Hôm nay</div>
                </div>
                
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={currentChat.shop.avatar} /></Avatar>
                  <div className="bg-white border rounded-2xl rounded-tl-none p-3 shadow-sm text-sm">
                    Xin chào! Bạn có quan tâm đến chiếc máy ảnh không?
                  </div>
                </div>
                
                <div className="flex gap-3 max-w-[80%] ml-auto justify-end">
                  <div className="bg-primary text-white rounded-2xl rounded-tr-none p-3 shadow-sm text-sm">
                    Vâng, cuối tuần này còn hàng để thuê không ạ?
                  </div>
                </div>

                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={currentChat.shop.avatar} /></Avatar>
                  <div className="bg-white border rounded-2xl rounded-tl-none p-3 shadow-sm text-sm">
                    {currentChat.lastMessage}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t">
                <div className="flex items-center gap-2 bg-gray-50 rounded-full border p-1 pl-4 focus-within:border-primary transition-colors">
                  <Input placeholder="Nhập tin nhắn..." className="border-transparent bg-transparent shadow-none focus-visible:ring-0 px-0" />
                  <Button size="icon" className="rounded-full shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <img src={`${import.meta.env.BASE_URL}images/empty-messages.png`} alt="Chọn cuộc trò chuyện" className="w-48 h-48 opacity-60 mb-6" />
              <h3 className="text-xl font-bold mb-2">Tin nhắn của bạn</h3>
              <p className="text-muted-foreground">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
