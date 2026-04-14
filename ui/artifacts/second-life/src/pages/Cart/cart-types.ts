import type { CartItem } from "@/hooks/use-mock-api";

export type ModeKey = `${string}:buy` | `${string}:rent`;

export interface ItemState {
  buyQty: number;
  rentQty: number;
  rentStart: string;
  rentEnd: string;
  buyStatus: "idle" | "checking" | "ok" | "error";
  buyMsg: string;
  rentStatus: "idle" | "checking" | "ok" | "error";
  rentMsg: string;
}

export function defaultState(item: CartItem): ItemState {
  return {
    buyQty: item.quantity || 1,
    rentQty: item.quantity || 1,
    rentStart: "",
    rentEnd: "",
    buyStatus: "idle",
    buyMsg: "",
    rentStatus: "idle",
    rentMsg: "",
  };
}
