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
      <div
        className={cn(
          "aspect-square rounded-3xl overflow-hidden relative group",
          "border border-border/70 bg-muted/20 shadow-md ring-1 ring-border/40",
          "dark:border-border/50 dark:bg-muted/10 dark:shadow-2xl dark:shadow-black/30 dark:ring-border/30",
        )}
      >
        <img
          src={images[active]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border/50 bg-background/90 p-2 text-foreground shadow-md backdrop-blur-md transition-opacity hover:bg-accent opacity-0 group-hover:opacity-100 dark:border-border/40 dark:bg-background/85"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border/50 bg-background/90 p-2 text-foreground shadow-md backdrop-blur-md transition-opacity hover:bg-accent opacity-0 group-hover:opacity-100 dark:border-border/40 dark:bg-background/85"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1.5 backdrop-blur-md dark:bg-black/50">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectThumb(i)}
                  aria-label={`Ảnh ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-5 bg-primary" : "w-1.5 bg-white/70 hover:bg-white",
                  )}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full border border-border/40 bg-background/90 shadow-sm backdrop-blur-md hover:bg-accent dark:bg-background/85"
          >
            <Heart className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full border border-border/40 bg-background/90 shadow-sm backdrop-blur-md hover:bg-accent dark:bg-background/85"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setLightbox(active)}
          className="absolute bottom-4 right-4 rounded-full border border-border/40 bg-background/90 p-2 text-foreground shadow-md backdrop-blur-md opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 dark:bg-background/85"
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
                "w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all snap-start ring-2 ring-offset-2 ring-offset-background",
                active === idx
                  ? "border-transparent opacity-100 ring-primary dark:ring-offset-background"
                  : "border border-transparent opacity-65 hover:opacity-100 ring-transparent hover:ring-border/50",
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button type="button" className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/90 hover:bg-white/10" onClick={() => setLightbox(null)}>
            <X className="w-8 h-8" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
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
            className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i! + 1) % images.length);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur-md">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(i);
                }}
                className={cn("h-1.5 rounded-full transition-all", i === lightbox ? "w-5 bg-primary" : "w-1.5 bg-white/50")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
