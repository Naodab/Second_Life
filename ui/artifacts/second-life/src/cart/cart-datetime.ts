import { format } from "date-fns";

/** Backend expects `yyyy-MM-dd'T'HH:mm:ss` (no timezone suffix). */
export function toApiDateTime(value: Date): string {
  return format(value, "yyyy-MM-dd'T'HH:mm:ss");
}
