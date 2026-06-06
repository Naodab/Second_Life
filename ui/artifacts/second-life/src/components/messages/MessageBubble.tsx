import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MessageResponse } from "@/api/conversations";
import { cn } from "@/lib/utils";
import { MessageOrderCardBlock } from "./MessageOrderCardBlock";
import { MessageProductCardBlock } from "./MessageProductCardBlock";

type Props = {
  message: MessageResponse;
  isMine: boolean;
  peerAvatarUrl?: string;
  peerFallback?: ReactNode;
};

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isMine, peerAvatarUrl, peerFallback }: Props) {
  const images = message.imageUrls?.filter(Boolean) ?? [];
  const hasText = Boolean(message.content?.trim());
  const hasCard = Boolean(message.productCard || message.orderCard);

  return (
    <div className={cn("flex gap-2", isMine ? "justify-end" : "")}>
      {!isMine ? (
        <Avatar className="mt-1 h-8 w-8 shrink-0">
          <AvatarImage src={peerAvatarUrl} />
          <AvatarFallback className="text-xs">{peerFallback}</AvatarFallback>
        </Avatar>
      ) : null}
      <div className={cn("flex max-w-[min(85%,42rem)] flex-col gap-1.5", isMine ? "items-end" : "items-start")}>
        {(hasText || images.length > 0 || hasCard) && (
          <div
            className={cn(
              "space-y-3 rounded-2xl px-4 py-3 text-sm shadow-sm",
              isMine
                ? "rounded-tr-md bg-primary text-primary-foreground"
                : "rounded-tl-md border border-border bg-card text-card-foreground",
            )}
          >
            {hasText ? <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p> : null}
            {images.length > 0 ? (
              <div className={cn("grid gap-2", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                    <img src={url} alt="Ảnh đính kèm" className="max-h-72 w-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
            {message.productCard ? (
              <MessageProductCardBlock
                card={message.productCard}
                className={
                  isMine
                    ? "border-primary-foreground/25 bg-background text-foreground shadow-sm"
                    : "border-border bg-muted/30"
                }
              />
            ) : null}
            {message.orderCard ? (
              <MessageOrderCardBlock
                card={message.orderCard}
                className={
                  isMine
                    ? "border-primary-foreground/25 bg-background text-foreground shadow-sm"
                    : "border-border bg-muted/30"
                }
              />
            ) : null}
          </div>
        )}
        <span className="px-1 text-[11px] text-muted-foreground">{formatMessageTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
