import { facilityAvatarUrl } from "@/api/facility";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl?: string | null;
  name?: string | null;
  className?: string;
};

export function FacilityConversationAvatar({ imageUrl, name, className }: Props) {
  const src = facilityAvatarUrl({ imageUrl: imageUrl ?? undefined });

  return (
    <img
      src={src}
      alt={name?.trim() || "Cơ sở"}
      className={cn("rounded-full object-cover", className)}
    />
  );
}
