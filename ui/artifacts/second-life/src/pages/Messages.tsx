import { Loader2, Search, Store, User, ChevronLeft, Building2 } from "lucide-react";

import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMessagesPage } from "./useMessagesPage";

export default function Messages() {
  const {
    tab,
    changeTab,
    conversations,
    conversationsLoading,
    activeConversation,
    activeConversationId,
    selectConversation,
    messages,
    messagesLoading,
    sendMessage,
    openingConversation,
    profileId,
    isMine,
    formatConversationTime,
  } = useMessagesPage();

  const peerTitle =
    tab === "facilities"
      ? activeConversation?.facilityName ?? "Cơ sở"
      : `Khách ${activeConversation?.buyerProfileId?.slice(0, 8) ?? ""}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)]">
      <div className="bg-white rounded-3xl border shadow-sm h-full flex overflow-hidden">
        <div
          className={cn(
            "w-full md:w-80 border-r flex flex-col flex-shrink-0",
            activeConversationId ? "hidden md:flex" : "flex",
          )}
        >
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold font-display mb-4">Tin nhắn</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm..." className="pl-9 bg-gray-50 border-transparent rounded-full" />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => changeTab("facilities")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === "facilities" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Store className="w-3.5 h-3.5" /> Với cơ sở
              </button>
              <button
                onClick={() => changeTab("customers")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === "customers" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <User className="w-3.5 h-3.5" /> Với khách
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                {tab === "facilities" ? "Cuộc trò chuyện với cơ sở" : "Khách nhắn cho cơ sở của bạn"}
              </p>
            </div>

            {conversationsLoading || openingConversation ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">
                {tab === "facilities"
                  ? "Chưa có cuộc trò chuyện nào. Hãy chat từ trang sản phẩm hoặc cơ sở."
                  : "Chưa có khách hàng nhắn tin."}
              </p>
            ) : (
              conversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectConversation(chat.id)}
                  className={cn(
                    "px-4 py-3 border-b cursor-pointer flex gap-3 hover:bg-gray-50 transition-colors border-l-4",
                    activeConversationId === chat.id ? "bg-primary/5 border-l-primary" : "border-l-transparent",
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-11 w-11 border">
                      <AvatarFallback>
                        {tab === "facilities" ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    {chat.unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                        {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-semibold text-sm truncate">
                        {tab === "facilities" ? chat.facilityName ?? "Cơ sở" : `Khách ${chat.buyerProfileId.slice(0, 8)}`}
                      </h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatConversationTime(chat.lastMessageAt)}
                      </span>
                    </div>
                    {tab === "customers" ? (
                      <div className="flex items-center gap-1 mb-0.5">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{chat.facilityName}</span>
                      </div>
                    ) : null}
                    <p
                      className={cn(
                        "text-xs truncate",
                        chat.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {chat.lastMessagePreview || "Bắt đầu trò chuyện"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={cn("flex-1 flex flex-col min-w-0", !activeConversationId ? "hidden md:flex" : "flex")}>
          {activeConversation ? (
            <>
              <div className="h-16 border-b px-4 flex items-center gap-3 flex-shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => selectConversation(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border flex-shrink-0">
                  <AvatarFallback>{tab === "facilities" ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{peerTitle}</h3>
                  {tab === "customers" ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {activeConversation.facilityName}
                    </p>
                  ) : (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Cơ sở Second Life
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="ml-auto text-xs hidden sm:flex items-center gap-1">
                  {tab === "facilities" ? (
                    <>
                      <Store className="w-3 h-3" /> Cơ sở
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" /> Khách hàng
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex-1 bg-gray-50/50 p-4 overflow-y-auto space-y-3">
                {messagesLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">
                    Chưa có tin nhắn. Hãy gửi lời chào hoặc đính kèm sản phẩm/đơn hàng.
                  </p>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={isMine(message.senderProfileId)}
                      peerFallback={tab === "facilities" ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    />
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t flex-shrink-0">
                <MessageComposer
                  disabled={!profileId}
                  onSend={sendMessage}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                {tab === "facilities" ? (
                  <Store className="w-10 h-10 text-primary/50" />
                ) : (
                  <User className="w-10 h-10 text-primary/50" />
                )}
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
