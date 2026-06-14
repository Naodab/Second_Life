import { format } from "date-fns";

export function toApiDateTime(value: Date): string {
  return format(value, "yyyy-MM-dd'T'HH:mm:ss");
}
