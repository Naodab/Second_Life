import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ReviewMediaLightbox({
  media,
  startIdx,
  onClose,
}: {
  media: string[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  return (
    <div role="presentation" className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button type="button" className="absolute top-4 right-4 text-white z-10" onClick={onClose}>
        <X className="w-8 h-8" />
      </button>
      {media.length > 1 && (
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => (i - 1 + media.length) % media.length);
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      <img
        src={media[idx]}
        alt="Ảnh đánh giá"
        className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {media.length > 1 && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => (i + 1) % media.length);
          }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
