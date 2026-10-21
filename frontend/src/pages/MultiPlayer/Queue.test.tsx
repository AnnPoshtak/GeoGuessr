import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Queue from "./Queue";
import queryClient from "@/api/queryClient";
import { useMultiplayerContext } from "@/context/MultiplayerContext";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { toast } from "sonner";
import type { GameQueue } from "@/interfaces/GameQueue";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/api/queryClient", () => ({
  default: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

vi.mock("@/context/MultiplayerContext", () => ({
  useMultiplayerContext: vi.fn(),
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
      emit: vi.fn(),
    };
  };

  return {
    gameQueue: createMockSocket(),
    gameRoom: createMockSocket(),
  };
});

describe("Queue Component - Unit Tests", () => {
  const mockSetGameKey = vi.fn();
  const mockJoin = vi.fn();
  const mockLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (gameQueue as any).listeners = {};
    (gameRoom as any).listeners = {};
    (useMultiplayerContext as any).mockReturnValue({
      setGameKey: mockSetGameKey,
    });
  });

  it("renders without crashing when queue is null", () => {
    const { container } = render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);
    expect(container).toBeDefined();
  });

  it("renders without crashing when queue is undefined", () => {
    const { container } = render(<Queue queue={undefined} join={mockJoin} leave={mockLeave} />);
    expect(container).toBeDefined();
  });

  it("renders idle state UI when no active queue is provided", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    expect(screen.getByRole("heading", { level: 2, name: /ready to battle\?/i })).toBeInTheDocument();
    expect(
      screen.getByText(/join matchmaking to find opponents and prove your geography knowledge\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find match/i })).toBeInTheDocument();
  });

  it("renders searching queue state UI when queue object is provided", () => {
    const mockQueueData: GameQueue = {
      players: [{ id: 1, username: "Player1" }],
      player_count: 4,
    } as any;

    render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);

    expect(screen.getByRole("heading", { level: 2, name: /searching for opponents\.\.\./i })).toBeInTheDocument();
    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /leave queue/i })).toBeInTheDocument();
  });

  it("calculates remaining players correctly when queue is partially full", () => {
    const mockQueueData: GameQueue = {
      players: [{ id: 1 }, { id: 2 }],
      player_count: 5,
    } as any;

    render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);

    expect(screen.getByText("2/5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("handles 0 player_count without throwing", () => {
    const mockQueueData: GameQueue = {
      players: [],
      player_count: 0,
    } as any;

    render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);

    expect(screen.getByText("0/0")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("calls join callback when 'Find Match' button is clicked", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    const findMatchBtn = screen.getByRole("button", { name: /find match/i });
    fireEvent.click(findMatchBtn);

    expect(mockJoin).toHaveBeenCalledTimes(1);
  });

  it("calls leave callback when 'Leave Queue' button is clicked", () => {
    const mockQueueData: GameQueue = {
      players: [{ id: 1 }],
      player_count: 2,
    } as any;

    render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);

    const leaveBtn = screen.getByRole("button", { name: /leave queue/i });
    fireEvent.click(leaveBtn);

    expect(mockLeave).toHaveBeenCalledTimes(1);
  });
});

describe("Queue Component - WebSocket Events & Integration", () => {
  const mockSetGameKey = vi.fn();
  const mockJoin = vi.fn();
  const mockLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (gameQueue as any).listeners = {};
    (gameRoom as any).listeners = {};
    (useMultiplayerContext as any).mockReturnValue({
      setGameKey: mockSetGameKey,
    });
  });

  it("subscribes to gameQueue WebSocket events on mount", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    expect(gameQueue.on).toHaveBeenCalledWith("message", expect.any(Function));
    expect(gameQueue.on).toHaveBeenCalledWith("queue_joined", expect.any(Function));
    expect(gameQueue.on).toHaveBeenCalledWith("queue_left", expect.any(Function));
    expect(gameQueue.on).toHaveBeenCalledWith("game_started", expect.any(Function));
  });

  it("unsubscribes from gameQueue WebSocket events on unmount", () => {
    const { unmount } = render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    unmount();

    expect(gameQueue.off).toHaveBeenCalledWith("queue_joined");
    expect(gameQueue.off).toHaveBeenCalledWith("queue_left");
    expect(gameQueue.off).toHaveBeenCalledWith("game_started");
    expect(gameQueue.off).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("displays toast error when WS 'message' event is emitted", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    const messageCallback = (gameQueue.on as any).mock.calls.find(
      (call: any) => call[0] === "message"
    )[1];

    messageCallback("Queue full!");

    expect(toast.error).toHaveBeenCalledWith("Queue full!");
  });

  it("invalidates 'queue' query on WS 'queue_joined' event", async () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    const queueJoinedCallback = (gameQueue.on as any).mock.calls.find(
      (call: any) => call[0] === "queue_joined"
    )[1];

    await queueJoinedCallback();

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["queue"],
    });
  });

  it("updates query data on WS 'queue_left' event when previous queue state exists", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    const queueLeftCallback = (gameQueue.on as any).mock.calls.find(
      (call: any) => call[0] === "queue_left"
    )[1];

    queueLeftCallback({ queue: [{ id: 1, username: "Player1" }] });

    expect(queryClient.setQueryData).toHaveBeenCalledWith(["queue"], expect.any(Function));

    const updaterFn = (queryClient.setQueryData as any).mock.calls[0][1];
    const oldQueueData: GameQueue = {
      players: [{ id: 1 }, { id: 2 }],
      player_count: 4,
    } as any;

    const result = updaterFn(oldQueueData);

    expect(result).toEqual({
      players: [{ id: 1, username: "Player1" }],
      player_count: 4,
    });
  });

  it("returns null when updaterFn receives null in 'queue_left' callback", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    const queueLeftCallback = (gameQueue.on as any).mock.calls.find(
      (call: any) => call[0] === "queue_left"
    )[1];

    queueLeftCallback({ queue: [] });

    const updaterFn = (queryClient.setQueryData as any).mock.calls[0][1];
    const result = updaterFn(null);

    expect(result).toBeNull();
  });

  it("handles WS 'game_started' event by setting game key and emitting room join", () => {
    render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);

    const gameStartedCallback = (gameQueue.on as any).mock.calls.find(
      (call: any) => call[0] === "game_started"
    )[1];

    gameStartedCallback({ game_key: "secret-game-key-123" });

    expect(mockSetGameKey).toHaveBeenCalledWith("secret-game-key-123");
    expect(gameRoom.emit).toHaveBeenCalledWith("join", {
      game_key: "secret-game-key-123",
    });
  });
});

describe("Queue Component - DOM & Styling Edge Cases", () => {
  const mockSetGameKey = vi.fn();
  const mockJoin = vi.fn();
  const mockLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMultiplayerContext as any).mockReturnValue({
      setGameKey: mockSetGameKey,
    });
  });

  it("has full-width center flex layout container classes", () => {
    const { container } = render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);
    const rootDiv = container.firstChild as HTMLElement;

    expect(rootDiv).toHaveClass("flex", "flex-col", "items-center", "justify-center", "w-full");
  });

  it("renders animated pulse element on searching text when queue is present", () => {
    const mockQueueData: GameQueue = {
      players: [],
      player_count: 2,
    } as any;

    render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);

    const animatedHeader = screen.getByRole("heading", { name: /searching for opponents\.\.\./i });
    expect(animatedHeader).toHaveClass("animate-pulse");
  });

  it("renders animated spinner when in queue state", () => {
    const mockQueueData: GameQueue = {
      players: [],
      player_count: 2,
    } as any;

    const { container } = render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);
    const spinner = container.querySelector(".animate-spin");

    expect(spinner).toBeInTheDocument();
  });

  it("matches DOM snapshot for null queue", () => {
    const { container } = render(<Queue queue={null} join={mockJoin} leave={mockLeave} />);
    expect(container).toMatchSnapshot();
  });

  it("matches DOM snapshot for active searching queue", () => {
    const mockQueueData: GameQueue = {
      players: [{ id: 10, username: "Alex" }],
      player_count: 4,
    } as any;

    const { container } = render(<Queue queue={mockQueueData} join={mockJoin} leave={mockLeave} />);
    expect(container).toMatchSnapshot();
  });
});