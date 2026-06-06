import { useRef, useState } from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";

import type { MessagePayload } from "@/api/conversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onSend: (payload: MessagePayload) => Promise<void>;
};

export function MessageComposer({ disabled, onSend }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const canSend = !disabled && !uploading && !sending && (text.trim().length > 0 || pendingImages.length > 0);

  const handlePickImages = async (files: FileList | null) => {
    if (!files?.length || disabled || uploading) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 10 - pendingImages.length)) {
        const url = await uploadImageToCloudinary(file);
        uploaded.push(url);
      }
      setPendingImages((prev) => [...prev, ...uploaded].slice(0, 10));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const payload: MessagePayload = {};
    const trimmed = text.trim();
    if (trimmed) payload.content = trimmed;
    if (pendingImages.length > 0) payload.imageUrls = pendingImages;

    setSending(true);
    try {
      await onSend(payload);
      setText("");
      setPendingImages([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      {pendingImages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pendingImages.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-0 top-0 cursor-pointer rounded-bl bg-black/60 p-0.5 text-white"
                onClick={() => setPendingImages((prev) => prev.filter((item) => item !== url))}
                aria-label="Xóa ảnh"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 p-1.5 pl-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handlePickImages(e.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          disabled={disabled || uploading || pendingImages.length >= 10}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>
        <Input
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          disabled={disabled || sending}
          className="min-h-11 border-transparent bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <Button
          size="icon"
          className={cn("shrink-0 rounded-full")}
          onClick={() => void handleSend()}
          disabled={!canSend}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
