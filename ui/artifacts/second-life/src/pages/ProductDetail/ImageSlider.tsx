import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Share2, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImageSlider({ images, productName }: { images: string[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  const selectThumb = (idx: number) => {
    setActive(idx);
    thumbRef.current?.children[idx]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className="space-y-4">
      <div className="aspect-square rounded-3xl overflow-hidden bg-white border shadow-sm relative group">
        <img
          src={images[active]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectThumb(i)}
                  className={cn("h-1.5 rounded-full transition-all", i === active ? "bg-white w-5" : "bg-white/50 w-1.5")}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setLightbox(active)}
          className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {images.length > 1 && (
        <div ref={thumbRef} className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectThumb(idx)}
              className={cn(
                "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all snap-start",
                active === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button type="button" className="absolute top-4 right-4 text-white hover:text-gray-300 z-10" onClick={() => setLightbox(null)}>
            <X className="w-8 h-8" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-white/10 rounded-full p-3"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i! - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={images[lightbox]}
            alt="Xem ảnh"
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-white/10 rounded-full p-3"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i! + 1) % images.length);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(i);
                }}
                className={cn("h-1.5 rounded-full transition-all", i === lightbox ? "bg-white w-5" : "bg-white/40 w-1.5")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
