import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useOnlineStatus } from "./useOnlineStatus";

describe("useOnlineStatus - Unit Tests", () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    });
  });

  it("initializes without crashing", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBeDefined();
  });

  it("returns true initially when navigator.onLine is true", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false initially when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("adds online and offline event listeners on mount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useOnlineStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("removes online and offline event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});

describe("useOnlineStatus - Event Handling & State Updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates isOnline to false when offline event is dispatched", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("updates isOnline to true when online event is dispatched", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("handles multiple consecutive offline events correctly", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });

  it("handles multiple consecutive online events correctly", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("correctly toggles status online -> offline -> online -> offline", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });

  it("does not update state after unmount when events are dispatched", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    const { result, unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(() => {
      act(() => {
        window.dispatchEvent(new Event("offline"));
        window.dispatchEvent(new Event("online"));
      });
    }).not.toThrow();

    expect(result.current).toBe(true);
  });
});

describe("useOnlineStatus - Environment & Edge Cases", () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    globalThis.navigator = originalNavigator;
  });

  it("defaults to true if navigator is undefined (SSR environment)", () => {
    vi.stubGlobal("navigator", undefined);

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });
});