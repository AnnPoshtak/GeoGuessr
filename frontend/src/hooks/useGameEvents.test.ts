import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGameEvents } from "./useGameEvents";
import { toast } from "sonner";
import { gameRoom, gameQueue } from "@/ws/wsClient";
import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import type { NewRoundData, EndGameData } from "../types";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/ws/wsClient", () => {
  const createMockSocket = () => {
    const listeners: Record<string, Function[]> = {};
    return {
      listeners,
      on: vi.fn((event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      }),
      off: vi.fn((event: string, callback?: Function) => {
        if (!listeners[event]) return;
        if (callback) {
          listeners[event] = listeners[event].filter((cb) => cb !== callback);
        } else {
          delete listeners[event];
        }
      }),
      emit: (event: string, data?: any) => {
        if (listeners[event]) {
          listeners[event].forEach((cb) => cb(data));
        }
      },
    };
  };

  return {
    gameRoom: createMockSocket(),
    gameQueue: createMockSocket(),
  };
});

describe("useGameEvents - Unit Tests", () => {
  const defaultProps = {
    isJoined: true,
    gameKey: "game-123",
    map: {} as google.maps.Map,
    viewRef: { current: null },
    onNewRound: vi.fn(),
    onGameEnd: vi.fn(),
    setGameState: vi.fn(),
    setIsPlayerConnected: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (gameRoom as any).listeners = {};
    (gameQueue as any).listeners = {};
  });

  it("initializes without crashing", () => {
    const { result } = renderHook(() => useGameEvents(defaultProps));
    expect(result.current).toBeUndefined();
  });

  it("does not subscribe to WS events if isJoined is false", () => {
    renderHook(() =>
      useGameEvents({
        ...defaultProps,
        isJoined: false,
      })
    );

    expect(gameRoom.on).not.toHaveBeenCalled();
    expect(gameQueue.on).not.toHaveBeenCalled();
  });

  it("subscribes to all gameRoom and gameQueue events when isJoined is true", () => {
    renderHook(() => useGameEvents(defaultProps));

    expect(gameRoom.on).toHaveBeenCalledWith("message", expect.any(Function));
    expect(gameRoom.on).toHaveBeenCalledWith("new_round", defaultProps.onNewRound);
    expect(gameQueue.on).toHaveBeenCalledWith("new_round", defaultProps.onNewRound);
    expect(gameRoom.on).toHaveBeenCalledWith("game_end", defaultProps.onGameEnd);
    expect(gameQueue.on).toHaveBeenCalledWith("game_end", defaultProps.onGameEnd);
    expect(gameRoom.on).toHaveBeenCalledWith("player_reconnected", expect.any(Function));
    expect(gameRoom.on).toHaveBeenCalledWith("player_disconnected", expect.any(Function));
    expect(gameRoom.on).toHaveBeenCalledWith("record_defeat_started", expect.any(Function));
    expect(gameRoom.on).toHaveBeenCalledWith("record_defeat_cancelled", expect.any(Function));
    expect(gameRoom.on).toHaveBeenCalledWith("team_submitted", expect.any(Function));
    expect(gameRoom.on).toHaveBeenCalledWith("real_target", expect.any(Function));
  });

  it("unsubscribes from events on unmount", () => {
    const { unmount } = renderHook(() => useGameEvents(defaultProps));

    unmount();

    expect(gameRoom.off).toHaveBeenCalledWith("new_round", defaultProps.onNewRound);
    expect(gameQueue.off).toHaveBeenCalledWith("new_round", defaultProps.onNewRound);
    expect(gameRoom.off).toHaveBeenCalledWith("game_end", defaultProps.onGameEnd);
    expect(gameQueue.off).toHaveBeenCalledWith("game_end", defaultProps.onGameEnd);
    expect(gameRoom.off).toHaveBeenCalledWith("message", expect.any(Function));
    expect(gameRoom.off).toHaveBeenCalledWith("player_reconnected");
    expect(gameRoom.off).toHaveBeenCalledWith("player_disconnected");
    expect(gameRoom.off).toHaveBeenCalledWith("record_defeat_started", expect.any(Function));
    expect(gameRoom.off).toHaveBeenCalledWith("record_defeat_cancelled", expect.any(Function));
    expect(gameRoom.off).toHaveBeenCalledWith("team_submitted", expect.any(Function));
    expect(gameRoom.off).toHaveBeenCalledWith("real_target", expect.any(Function));
  });
});

describe("useGameEvents - Event Callbacks Integration", () => {
  const defaultProps = {
    isJoined: true,
    gameKey: "game-123",
    map: {} as google.maps.Map,
    viewRef: { current: null },
    onNewRound: vi.fn(),
    onGameEnd: vi.fn(),
    setGameState: vi.fn(),
    setIsPlayerConnected: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (gameRoom as any).listeners = {};
    (gameQueue as any).listeners = {};
  });

  it("shows toast error on 'message' event", () => {
    renderHook(() => useGameEvents(defaultProps));

    (gameRoom as any).emit("message", "Something went wrong!");

    expect(toast.error).toHaveBeenCalledWith("Something went wrong!");
  });

  it("triggers onNewRound on gameRoom 'new_round' event", () => {
    renderHook(() => useGameEvents(defaultProps));

    const mockRoundData: NewRoundData = { round: 1 } as any;
    (gameRoom as any).emit("new_round", mockRoundData);

    expect(defaultProps.onNewRound).toHaveBeenCalledWith(mockRoundData);
  });

  it("triggers onNewRound on gameQueue 'new_round' event", () => {
    renderHook(() => useGameEvents(defaultProps));

    const mockRoundData: NewRoundData = { round: 2 } as any;
    (gameQueue as any).emit("new_round", mockRoundData);

    expect(defaultProps.onNewRound).toHaveBeenCalledWith(mockRoundData);
  });

  it("triggers onGameEnd on gameRoom 'game_end' event", () => {
    renderHook(() => useGameEvents(defaultProps));

    const mockEndData: EndGameData = { winner: "Team A" } as any;
    (gameRoom as any).emit("game_end", mockEndData);

    expect(defaultProps.onGameEnd).toHaveBeenCalledWith(mockEndData);
  });

  it("triggers onGameEnd on gameQueue 'game_end' event", () => {
    renderHook(() => useGameEvents(defaultProps));

    const mockEndData: EndGameData = { winner: "Team B" } as any;
    (gameQueue as any).emit("game_end", mockEndData);

    expect(defaultProps.onGameEnd).toHaveBeenCalledWith(mockEndData);
  });

  it("handles 'player_reconnected' event correctly", () => {
    renderHook(() => useGameEvents(defaultProps));

    (gameRoom as any).emit("player_reconnected", { id: 42, username: "Player1" });

    expect(defaultProps.setIsPlayerConnected).toHaveBeenCalledWith(42, true);
    expect(toast.info).toHaveBeenCalledWith("Player Player1 has reconnected!");
  });

  it("handles 'player_disconnected' event correctly", () => {
    renderHook(() => useGameEvents(defaultProps));

    (gameRoom as any).emit("player_disconnected", { id: 42, username: "Player1" });

    expect(defaultProps.setIsPlayerConnected).toHaveBeenCalledWith(42, false);
    expect(toast.info).toHaveBeenCalledWith("Player Player1 has disconnected!");
  });

  it("updates state on 'record_defeat_started'", () => {
    renderHook(() => useGameEvents(defaultProps));

    (gameRoom as any).emit("record_defeat_started", { team: "Red Team" });

    expect(defaultProps.setGameState).toHaveBeenCalledWith(expect.any(Function));

    const stateUpdater = defaultProps.setGameState.mock.calls[0][0];
    const newState = stateUpdater({ previousState: "value" });

    expect(newState).toEqual({
      previousState: "value",
      defeatTeamName: "Red Team",
    });
  });

  it("updates state on 'record_defeat_cancelled'", () => {
    renderHook(() => useGameEvents(defaultProps));

    (gameRoom as any).emit("record_defeat_cancelled");

    expect(defaultProps.setGameState).toHaveBeenCalledWith(expect.any(Function));

    const stateUpdater = defaultProps.setGameState.mock.calls[0][0];
    const newState = stateUpdater({ defeatTeamName: "Red Team" });

    expect(newState).toEqual({
      defeatTeamName: null,
    });
  });

  it("updates state on 'team_submitted'", () => {
    renderHook(() => useGameEvents(defaultProps));

    (gameRoom as any).emit("team_submitted", { seconds: 15 });

    expect(defaultProps.setGameState).toHaveBeenCalledWith(expect.any(Function));

    const stateUpdater = defaultProps.setGameState.mock.calls[0][0];
    const newState = stateUpdater({ autosubmitSeconds: 0 });

    expect(newState).toEqual({
      autosubmitSeconds: 15,
    });
  });

  it("updates viewRef position and pov on 'real_target' event when viewRef.current is present", () => {
    const mockSetPov = vi.fn();
    const mockSetPosition = vi.fn();

    const mockViewRef = {
      current: {
        setPov: mockSetPov,
        setPosition: mockSetPosition,
      } as unknown as google.maps.StreetViewPanorama,
    };

    renderHook(() =>
      useGameEvents({
        ...defaultProps,
        viewRef: mockViewRef,
      })
    );

    const targetLocation: StreetViewLocationFromApi = {
      lat: 50.4501,
      lng: 30.5234,
      heading: 180,
    } as any;

    (gameRoom as any).emit("real_target", { target: targetLocation });

    expect(mockSetPov).toHaveBeenCalledWith({ heading: 180, pitch: 5 });
    expect(mockSetPosition).toHaveBeenCalledWith({ lat: 50.4501, lng: 30.5234 });
  });

  it("does not throw or update viewRef on 'real_target' event when viewRef.current is null", () => {
    renderHook(() =>
      useGameEvents({
        ...defaultProps,
        viewRef: { current: null },
      })
    );

    const targetLocation: StreetViewLocationFromApi = {
      lat: 10,
      lng: 20,
      heading: 90,
    } as any;

    expect(() => {
      (gameRoom as any).emit("real_target", { target: targetLocation });
    }).not.toThrow();
  });
});

describe("useGameEvents - Re-renders & Dynamic Dependency Edge Cases", () => {
  const defaultProps = {
    isJoined: true,
    gameKey: "game-123",
    map: {} as google.maps.Map,
    viewRef: { current: null },
    onNewRound: vi.fn(),
    onGameEnd: vi.fn(),
    setGameState: vi.fn(),
    setIsPlayerConnected: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (gameRoom as any).listeners = {};
    (gameQueue as any).listeners = {};
  });

  it("resubscribes to events when isJoined changes from false to true", () => {
    const { rerender } = renderHook(
      (props) => useGameEvents(props),
      {
        initialProps: { ...defaultProps, isJoined: false },
      }
    );

    expect(gameRoom.on).not.toHaveBeenCalled();

    rerender({ ...defaultProps, isJoined: true });

    expect(gameRoom.on).toHaveBeenCalled();
  });

  it("unsubscribes from events when isJoined changes from true to false", () => {
    const { rerender } = renderHook(
      (props) => useGameEvents(props),
      {
        initialProps: { ...defaultProps, isJoined: true },
      }
    );

    expect(gameRoom.on).toHaveBeenCalled();

    rerender({ ...defaultProps, isJoined: false });

    expect(gameRoom.off).toHaveBeenCalled();
  });

  it("resubscribes when gameKey changes", () => {
    const { rerender } = renderHook(
      (props) => useGameEvents(props),
      {
        initialProps: { ...defaultProps, gameKey: "key-1" },
      }
    );

    rerender({ ...defaultProps, gameKey: "key-2" });

    expect(gameRoom.off).toHaveBeenCalled();
    expect(gameRoom.on).toHaveBeenCalledTimes(18);
  });

  it("resubscribes when map instance changes", () => {
    const map1 = {} as google.maps.Map;
    const map2 = {} as google.maps.Map;

    const { rerender } = renderHook(
      (props) => useGameEvents(props),
      {
        initialProps: { ...defaultProps, map: map1 },
      }
    );

    rerender({ ...defaultProps, map: map2 });

    expect(gameRoom.off).toHaveBeenCalled();
  });

  it("handles null gameKey gracefully", () => {
    renderHook(() =>
      useGameEvents({
        ...defaultProps,
        gameKey: null,
      })
    );

    expect(gameRoom.on).toHaveBeenCalled();
  });

  it("handles null map gracefully", () => {
    renderHook(() =>
      useGameEvents({
        ...defaultProps,
        map: null,
      })
    );

    expect(gameRoom.on).toHaveBeenCalled();
  });
});