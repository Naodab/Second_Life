import { Loader2, Search, Store, User, ChevronLeft, Building2 } from "lucide-react";

import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMessagesPage } from "./useMessagesPage";

export default function MessagesPage() {
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

  const showChatPanel = Boolean(activeConversationId && (activeConversation || openingConversation));

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-[min(920px,calc(100vh-7rem))] w-full max-w-[1600px] flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        {/* Sidebar */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col border-border md:w-[min(100%,380px)] md:border-r lg:w-[400px]",
            activeConversationId ? "hidden md:flex" : "flex",
          )}
        >
          <div className="border-b border-border p-5">
            <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Tin nhắn</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="h-11 rounded-full border-border bg-muted/50 pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => changeTab("facilities")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                  tab === "facilities"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Store className="h-4 w-4" /> Với cơ sở
              </button>
              <button
                type="button"
                onClick={() => changeTab("customers")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                  tab === "customers"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <User className="h-4 w-4" /> Với khách
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {tab === "facilities" ? "Cuộc trò chuyện với cơ sở" : "Khách nhắn cho cơ sở của bạn"}
              </p>
            </div>

            {conversationsLoading || openingConversation ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm leading-relaxed text-muted-foreground">
                {tab === "facilities"
                  ? "Chưa có cuộc trò chuyện nào. Hãy chat từ trang sản phẩm hoặc cơ sở."
                  : "Chưa có khách hàng nhắn tin."}
              </p>
            ) : (
              conversations.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => selectConversation(chat.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-border px-5 py-4 text-left transition-colors border-l-4 hover:bg-muted/50",
                    activeConversationId === chat.id
                      ? "border-l-primary bg-primary/5"
                      : "border-l-transparent",
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-muted">
                        {tab === "facilities" ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    {chat.unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h4 className="truncate text-sm font-semibold">
                        {tab === "facilities"
                          ? chat.facilityName ?? "Cơ sở"
                          : `Khách ${chat.buyerProfileId.slice(0, 8)}`}
                      </h4>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatConversationTime(chat.lastMessageAt)}
                      </span>
                    </div>
                    {tab === "customers" ? (
                      <div className="mb-1 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate text-xs text-muted-foreground">{chat.facilityName}</span>
                      </div>
                    ) : null}
                    <p
                      className={cn(
                        "truncate text-sm",
                        chat.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {chat.lastMessagePreview || "Bắt đầu trò chuyện"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={cn("flex min-w-0 flex-1 flex-col", !showChatPanel ? "hidden md:flex" : "flex")}>
          {showChatPanel ? (
            <>
              <div className="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-border px-5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => selectConversation(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-11 w-11 shrink-0 border border-border">
                  <AvatarFallback className="bg-muted">
                    {tab === "facilities" ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold">{peerTitle}</h3>
                  {tab === "customers" ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" /> {activeConversation?.facilityName}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Sẵn sàng trò chuyện
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="hidden items-center gap-1 text-xs sm:flex">
                  {tab === "facilities" ? (
                    <>
                      <Store className="h-3 w-3" /> Cơ sở
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" /> Khách hàng
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-5 sm:p-6">
                {openingConversation || messagesLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-20 text-center text-sm text-muted-foreground">
                    Chưa có tin nhắn. Hãy gửi lời chào hoặc đính kèm sản phẩm/đơn hàng.
                  </p>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={isMine(message.senderProfileId)}
                      peerFallback={
                        tab === "facilities" ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />
                      }
                    />
                  ))
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-card p-4 sm:p-5">
                <MessageComposer disabled={!profileId || openingConversation} onSend={sendMessage} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                {tab === "facilities" ? (
                  <Store className="h-12 w-12 text-primary/60" />
                ) : (
                  <User className="h-12 w-12 text-primary/60" />
                )}
              </div>
              <h3 className="mb-2 text-2xl font-bold">
                {tab === "facilities" ? "Tin nhắn với cơ sở" : "Tin nhắn từ khách hàng"}
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
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
