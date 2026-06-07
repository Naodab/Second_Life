import { useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Headphones, Loader2, Search, Shield, Store, User, ChevronLeft, Building2 } from "lucide-react";

import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { FacilityConversationAvatar } from "@/components/messages/FacilityConversationAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { facilityAvatarUrl } from "@/api/facility";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { messagesSearchPlaceholder } from "@/lib/messages-conversation-search";
import { useMessagesPage, type MessagesPageMode } from "./useMessagesPage";
import { useConversationParticipantProfiles } from "./useConversationParticipantProfiles";

function TabUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function MessagesPage({
  embedded = false,
  mode = "default",
}: {
  embedded?: boolean;
  mode?: MessagesPageMode;
}) {
  const {
    tab,
    changeTab,
    conversations,
    conversationsLoading,
    searchQuery,
    setSearchQuery,
    hasConversationSearch,
    hasAnyConversations,
    buyerUnreadCount,
    sellerUnreadCount,
    adminSupportUnreadCount,
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
  } = useMessagesPage({ mode });

  const isAdminInbox = mode === "admin";
  const isAdminSupportTab = !isAdminInbox && tab === "admin";
  const listTab = isAdminInbox ? "admin" : tab;

  const participantIds = useMemo(
    () =>
      isAdminInbox
        ? conversations.map((chat) => chat.buyerProfileId)
        : isAdminSupportTab && activeConversation
          ? []
          : [],
    [isAdminInbox, isAdminSupportTab, conversations, activeConversation],
  );

  const activeBuyerId = isAdminInbox ? activeConversation?.buyerProfileId ?? "" : "";
  const { displayName, avatarUrl, loading: profilesLoading } = useConversationParticipantProfiles(
    isAdminInbox
      ? [...participantIds, activeBuyerId].filter(Boolean)
      : [],
  );

  const peerTitle = isAdminInbox
    ? displayName(activeConversation?.buyerProfileId ?? "") ??
      `Người dùng ${activeConversation?.buyerProfileId?.slice(0, 8) ?? ""}`
    : isAdminSupportTab
      ? activeConversation?.facilityName ?? "Ban quản trị"
      : tab === "facilities"
        ? activeConversation?.facilityName ?? "Cơ sở"
        : `Khách ${activeConversation?.buyerProfileId?.slice(0, 8) ?? ""}`;

  const showChatPanel = Boolean(activeConversationId && (activeConversation || openingConversation));
  const activeFacilityImageUrl = activeConversation?.facilityImageUrl ?? null;
  const activeFacilityAvatarSrc = facilityAvatarUrl({ imageUrl: activeFacilityImageUrl ?? undefined });
  const activeFacilityPageHref =
    tab === "facilities" && activeConversation?.facilityId?.trim()
      ? `/facility/${encodeURIComponent(activeConversation.facilityId.trim())}`
      : null;
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el || messagesLoading || openingConversation) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, messagesLoading, openingConversation, activeConversationId]);

  useEffect(() => {
    if (!isAdminInbox && !isAdminSupportTab) return;
    if (conversations.length === 1 && !activeConversationId && !conversationsLoading) {
      selectConversation(conversations[0]!.id);
    }
  }, [
    isAdminInbox,
    isAdminSupportTab,
    conversations,
    activeConversationId,
    conversationsLoading,
    selectConversation,
  ]);

  return (
    <div
      data-testid="messages-page-shell"
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30 p-4 sm:p-6"
          : "flex h-[calc(100dvh-var(--site-header-height))] max-h-[calc(100dvh-var(--site-header-height))] min-h-0 flex-col overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-8"
      }
    >
      <div
        data-testid="messages-layout-card"
        className={
          embedded
            ? "flex min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            : "mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
        }
      >
        <div
          className={cn(
            "flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-border md:w-[min(100%,380px)] md:border-r lg:w-[400px]",
            activeConversationId ? "hidden md:flex" : "flex",
          )}
        >
          <div className="shrink-0 border-b border-border p-5">
            <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">
              {isAdminInbox ? "Tin nhắn người dùng" : "Tin nhắn"}
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={messagesSearchPlaceholder(listTab)}
                aria-label={messagesSearchPlaceholder(listTab)}
                data-testid="messages-conversation-search"
                className="h-11 rounded-full border-border bg-muted/50 pl-9"
              />
            </div>
            {!isAdminInbox ? (
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => changeTab("facilities")}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all",
                    tab === "facilities"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Store className="h-4 w-4 shrink-0" /> Cơ sở
                  <TabUnreadBadge count={buyerUnreadCount} />
                </button>
                <button
                  type="button"
                  onClick={() => changeTab("admin")}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all",
                    tab === "admin"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Shield className="h-4 w-4 shrink-0" /> Admin
                  <TabUnreadBadge count={adminSupportUnreadCount} />
                </button>
                <button
                  type="button"
                  onClick={() => changeTab("customers")}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all",
                    tab === "customers"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <User className="h-4 w-4 shrink-0" /> Khách
                  <TabUnreadBadge count={sellerUnreadCount} />
                </button>
              </div>
            ) : null}
          </div>

          <div
            data-testid="messages-conversation-list"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="px-4 py-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isAdminInbox
                  ? "Người dùng nhắn tin"
                  : tab === "facilities"
                    ? "Cuộc trò chuyện với cơ sở"
                    : tab === "admin"
                      ? "Hỗ trợ từ ban quản trị"
                      : "Khách nhắn cho cơ sở của bạn"}
              </p>
            </div>

            {conversationsLoading || openingConversation ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : conversations.length === 0 && !hasAnyConversations ? (
              <p className="px-6 py-12 text-center text-sm leading-relaxed text-muted-foreground">
                {isAdminInbox
                  ? "Chưa có người dùng nào nhắn tin."
                  : tab === "facilities"
                    ? "Chưa có cuộc trò chuyện nào. Hãy chat từ trang sản phẩm hoặc cơ sở."
                    : tab === "admin"
                      ? "Đang mở kênh hỗ trợ với ban quản trị…"
                      : "Chưa có khách hàng nhắn tin."}
              </p>
            ) : conversations.length === 0 && hasConversationSearch ? (
              <p className="px-6 py-12 text-center text-sm leading-relaxed text-muted-foreground">
                Không tìm thấy cuộc trò chuyện phù hợp với &quot;{searchQuery.trim()}&quot;.
              </p>
            ) : (
              conversations.map((chat) => {
                const buyerName = displayName(chat.buyerProfileId);
                const buyerAvatar = avatarUrl(chat.buyerProfileId);
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => selectConversation(chat.id)}
                    className={cn(
                      "flex w-full cursor-pointer gap-3 border-b border-border px-5 py-4 text-left transition-colors border-l-4 hover:bg-muted/50",
                      activeConversationId === chat.id
                        ? "border-l-primary bg-primary/5"
                        : "border-l-transparent",
                    )}
                  >
                    <div className="relative shrink-0">
                      {isAdminInbox ? (
                        <Avatar className="h-12 w-12 border border-border">
                          {buyerAvatar ? <AvatarImage src={buyerAvatar} alt="" /> : null}
                          <AvatarFallback className="bg-muted">
                            {(buyerName ?? chat.buyerProfileId).slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : tab === "facilities" ? (
                        <FacilityConversationAvatar
                          imageUrl={chat.facilityImageUrl}
                          name={chat.facilityName}
                          className="h-12 w-12 border border-border"
                        />
                      ) : tab === "admin" ? (
                        <Avatar className="h-12 w-12 border border-border bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Shield className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarFallback className="bg-muted">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {chat.unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold">
                          {isAdminInbox
                            ? buyerName ?? `Người dùng ${chat.buyerProfileId.slice(0, 8)}`
                            : tab === "facilities"
                              ? chat.facilityName ?? "Cơ sở"
                              : tab === "admin"
                                ? chat.facilityName ?? "Ban quản trị"
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
                );
              })
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            !showChatPanel ? "hidden md:flex" : "flex",
          )}
        >
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
                {isAdminInbox ? (
                  <Avatar className="h-11 w-11 shrink-0 border border-border">
                    {avatarUrl(activeConversation?.buyerProfileId ?? "") ? (
                      <AvatarImage
                        src={avatarUrl(activeConversation?.buyerProfileId ?? "")!}
                        alt=""
                      />
                    ) : null}
                    <AvatarFallback className="bg-muted">
                      {profilesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        (peerTitle.slice(0, 1) || "U").toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                ) : tab === "facilities" ? (
                  <FacilityConversationAvatar
                    imageUrl={activeFacilityImageUrl}
                    name={activeConversation?.facilityName}
                    className="h-11 w-11 shrink-0 border border-border"
                  />
                ) : tab === "admin" ? (
                  <Avatar className="h-11 w-11 shrink-0 border border-border bg-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Shield className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-11 w-11 shrink-0 border border-border">
                    <AvatarFallback className="bg-muted">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold">
                    {activeFacilityPageHref ? (
                      <Link
                        href={activeFacilityPageHref}
                        className="cursor-pointer truncate transition-colors hover:text-primary hover:underline"
                      >
                        {peerTitle}
                      </Link>
                    ) : (
                      peerTitle
                    )}
                  </h3>
                  {tab === "customers" ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" /> {activeConversation?.facilityName}
                    </p>
                  ) : isAdminSupportTab || isAdminInbox ? (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Hỗ trợ trực tuyến
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Sẵn sàng trò chuyện
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="hidden items-center gap-1 text-xs sm:flex">
                  {isAdminInbox || isAdminSupportTab ? (
                    <>
                      <Headphones className="h-3 w-3" /> Hỗ trợ
                    </>
                  ) : tab === "facilities" ? (
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

              <div
                ref={messagesScrollRef}
                data-testid="messages-thread-scroll"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-muted/20 p-5 sm:p-6"
              >
                {openingConversation || messagesLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-20 text-center text-sm text-muted-foreground">
                    {isAdminSupportTab || isAdminInbox
                      ? "Chưa có tin nhắn. Hãy gửi lời chào để bắt đầu."
                      : "Chưa có tin nhắn. Hãy gửi lời chào hoặc đính kèm sản phẩm/đơn hàng."}
                  </p>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={isMine(message.senderProfileId)}
                      peerAvatarUrl={
                        tab === "facilities"
                          ? activeFacilityAvatarSrc
                          : isAdminInbox
                            ? avatarUrl(activeConversation?.buyerProfileId ?? "") ?? undefined
                            : undefined
                      }
                      peerFallback={
                        tab === "facilities" ? undefined : isAdminSupportTab ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )
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
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-10 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                {isAdminInbox ? (
                  <User className="h-12 w-12 text-primary/60" />
                ) : tab === "facilities" ? (
                  <Store className="h-12 w-12 text-primary/60" />
                ) : tab === "admin" ? (
                  <Shield className="h-12 w-12 text-primary/60" />
                ) : (
                  <User className="h-12 w-12 text-primary/60" />
                )}
              </div>
              <h3 className="mb-2 text-2xl font-bold">
                {isAdminInbox
                  ? "Tin nhắn từ người dùng"
                  : tab === "facilities"
                    ? "Tin nhắn với cơ sở"
                    : tab === "admin"
                      ? "Nhắn tin với ban quản trị"
                      : "Tin nhắn từ khách hàng"}
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {isAdminInbox
                  ? "Chọn một người dùng để xem và trả lời tin nhắn."
                  : tab === "facilities"
                    ? "Chọn một cuộc trò chuyện với cơ sở để tiếp tục."
                    : tab === "admin"
                      ? "Liên hệ ban quản trị khi cần hỗ trợ về tài khoản, đơn hàng hoặc sự cố."
                      : "Chọn một tin nhắn từ khách hàng để xem và trả lời."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
