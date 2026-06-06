import { ExternalLink, MapPin } from "lucide-react";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsOpenUrl, type FacilityMapSource } from "@/lib/google-maps";
import { cn } from "@/lib/utils";

type FacilityMapEmbedProps = {
  facility: FacilityMapSource;
  className?: string;
};

export function FacilityMapEmbed({ facility, className }: FacilityMapEmbedProps) {
  const embedUrl = buildGoogleMapsEmbedUrl(facility);
  const openUrl = buildGoogleMapsOpenUrl(facility);

  if (!embedUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-muted/20 dark:border-border/50 dark:bg-muted/10",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2 dark:border-border/40">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
          Vị trí
        </span>
        {openUrl ? (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            Google Maps
          </a>
        ) : null}
      </div>
      <div className="relative h-36 w-full sm:h-40">
        <iframe
          title="Vị trí cơ sở trên bản đồ"
          src={embedUrl}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
