import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast, useToast } from "./use-toast";

describe("use-toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toasts.forEach((item) => result.current.dismiss(item.id));
    });
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("auto-dismisses toast after duration when untouched", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Thông báo mới", duration: 10_000 });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.open).toBe(true);
    expect(result.current.toasts[0]?.duration).toBe(10_000);

    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(result.current.toasts[0]?.open).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toasts[0]?.open).toBe(false);
  });

  it("does not schedule auto-dismiss when duration is omitted", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Lưu thành công" });
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.toasts[0]?.open).toBe(true);
  });

  it("clears auto-dismiss timer when toast is dismissed manually", () => {
    const { result } = renderHook(() => useToast());
    let handle: ReturnType<typeof toast> | undefined;

    act(() => {
      handle = toast({ title: "Đơn hàng mới", duration: 10_000 });
    });

    act(() => {
      handle?.dismiss();
    });
    expect(result.current.toasts[0]?.open).toBe(false);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.toasts[0]?.open).toBe(false);
  });
});
