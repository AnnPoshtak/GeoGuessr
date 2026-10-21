import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MultiplayerMenu from "./MultiplayerMenu";
import { useNavigate } from "react-router-dom";
import { useMultiplayerContext } from "@/context/MultiplayerContext";
import { useUser } from "@/context/UserContext.tsx";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import fetchQueue from "@/ws/fetchQueue";
import queryClient from "@/api/queryClient";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/context/MultiplayerContext", () => ({
    useMultiplayerContext: vi.fn(),
}));

vi.mock("@/context/UserContext.tsx", () => ({
    useUser: vi.fn(),
}));

vi.mock("@/hooks/useOnlineStatus", () => ({
    useOnlineStatus: vi.fn(),
}));

vi.mock("@/ws/fetchQueue", () => ({
    default: vi.fn(),
}));

vi.mock("@/api/queryClient", () => ({
    default: {
        invalidateQueries: vi.fn(),
    },
}));

vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(),
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

vi.mock("@/components/Header/Header", () => ({
    Header: vi.fn(() => <header data-testid="mock-header">Header</header>),
}));

vi.mock("./Queue", () => ({
    default: vi.fn(({ queue, join, leave }) => (
        <div data-testid="mock-queue">
            <span>Queue Component</span>
            <button data-testid="mock-queue-join" onClick={join}>
                Join Queue Inner
            </button>
            <button data-testid="mock-queue-leave" onClick={leave}>
                Leave Queue Inner
            </button>
            {queue && <span data-testid="mock-queue-players">{queue.player_count}</span>}
        </div>
    )),
}));

describe("MultiplayerMenu - Unit & Rendering Tests", () => {
    const mockNavigate = vi.fn();
    const mockSetIsJoined = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (gameQueue as any).listeners = {};
        (gameRoom as any).listeners = {};
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useMultiplayerContext).mockReturnValue({
            setIsJoined: mockSetIsJoined,
        } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(true);
        vi.mocked(useQuery).mockReturnValue({ data: null } as any);
    });

    it("renders loading state when user is undefined", () => {
        vi.mocked(useUser).mockReturnValue({ user: undefined } as any);

        render(<MultiplayerMenu />);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(screen.queryByTestId("mock-header")).not.toBeInTheDocument();
    });

    it("renders null when user is null", () => {
        vi.mocked(useUser).mockReturnValue({ user: null } as any);

        const { container } = render(<MultiplayerMenu />);

        expect(container.firstChild).toBeNull();
    });

    it("redirects to home and shows toast when user is null", () => {
        vi.mocked(useUser).mockReturnValue({ user: null } as any);

        render(<MultiplayerMenu />);

        expect(mockNavigate).toHaveBeenCalledWith("/");
        expect(toast.info).toHaveBeenCalledWith(
            "To play in multiplayer mode, you need to log in to your account"
        );
    });

    it("renders main menu when user is authenticated and no mode selected", () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1, name: "Test" } } as any);

        render(<MultiplayerMenu />);

        expect(screen.getByTestId("mock-header")).toBeInTheDocument();
        expect(screen.getByText("Select")).toBeInTheDocument();
        expect(screen.getByText("Multiplayer Mode")).toBeInTheDocument();
        expect(screen.getByText("1 vs 1")).toBeInTheDocument();
        expect(screen.getByText("2 vs 2")).toBeInTheDocument();
        expect(screen.getByText("Back to Menu")).toBeInTheDocument();
    });

    it("shows offline badge when isOnline is false", () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(false);

        render(<MultiplayerMenu />);

        expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("hides offline badge when isOnline is true", () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(true);

        render(<MultiplayerMenu />);

        expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    });

    it("renders Queue component when mode is selected", () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);

        render(<MultiplayerMenu />);

        fireEvent.click(screen.getByText("1 vs 1"));

        expect(screen.getByTestId("mock-queue")).toBeInTheDocument();
        expect(screen.getByText("Change Mode")).toBeInTheDocument();
        expect(screen.queryByText("Select")).not.toBeInTheDocument();
    });
});

describe("MultiplayerMenu - React Query & Queue Auto-Selection Integration", () => {
    const mockNavigate = vi.fn();
    const mockSetIsJoined = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (gameQueue as any).listeners = {};
        (gameRoom as any).listeners = {};
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useMultiplayerContext).mockReturnValue({
            setIsJoined: mockSetIsJoined,
        } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(true);
    });

    it("executes query function fetchQueue inside useQuery", async () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
        (fetchQueue as any).mockResolvedValue({ player_count: 2 });

        vi.mocked(useQuery).mockImplementation(({ queryFn }: any) => {
            queryFn();
            return { data: null } as any;
        });

        render(<MultiplayerMenu />);

        expect(fetchQueue).toHaveBeenCalled();
    });

    it("auto-selects '1v1' mode if queue data player_count is 2", () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
        vi.mocked(useQuery).mockReturnValue({
            data: { player_count: 2, players: [] },
        } as any);

        render(<MultiplayerMenu />);

        expect(screen.getByTestId("mock-queue")).toBeInTheDocument();
        expect(screen.getByTestId("mock-queue-players").textContent).toBe("2");
    });

    it("auto-selects '2v2' mode if queue data player_count is 4", () => {
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
        vi.mocked(useQuery).mockReturnValue({
            data: { player_count: 4, players: [] },
        } as any);

        render(<MultiplayerMenu />);

        expect(screen.getByTestId("mock-queue")).toBeInTheDocument();
        expect(screen.getByTestId("mock-queue-players").textContent).toBe("4");
    });
});

describe("MultiplayerMenu - User Actions & Mode Logic", () => {
    const mockNavigate = vi.fn();
    const mockSetIsJoined = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (gameQueue as any).listeners = {};
        (gameRoom as any).listeners = {};
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useMultiplayerContext).mockReturnValue({
            setIsJoined: mockSetIsJoined,
        } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(true);
        vi.mocked(useQuery).mockReturnValue({ data: null } as any);
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
    });

    it("selects 1v1 mode and emits correct player_count when joining queue", () => {
        render(<MultiplayerMenu />);

        fireEvent.click(screen.getByText("1 vs 1"));

        const joinBtn = screen.getByTestId("mock-queue-join");
        fireEvent.click(joinBtn);

        expect(gameQueue.emit).toHaveBeenCalledWith("join", { player_count: 2 });
    });

    it("selects 2v2 mode and emits correct player_count when joining queue", () => {
        render(<MultiplayerMenu />);

        fireEvent.click(screen.getByText("2 vs 2"));

        const joinBtn = screen.getByTestId("mock-queue-join");
        fireEvent.click(joinBtn);

        expect(gameQueue.emit).toHaveBeenCalledWith("join", { player_count: 4 });
    });

    it("handles leaveQueue action correctly", () => {
        render(<MultiplayerMenu />);

        fireEvent.click(screen.getByText("1 vs 1"));

        const leaveBtn = screen.getByTestId("mock-queue-leave");
        fireEvent.click(leaveBtn);

        expect(gameQueue.emit).toHaveBeenCalledWith("leave");
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["queue"] });
        expect(screen.queryByTestId("mock-queue")).not.toBeInTheDocument();
    });

    it("navigates home and leaves queue when clicking 'Back to Menu'", () => {
        render(<MultiplayerMenu />);

        const backBtn = screen.getByText("Back to Menu");
        fireEvent.click(backBtn);

        expect(gameQueue.emit).toHaveBeenCalledWith("leave");
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["queue"] });
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates home and leaves queue when clicking 'Change Mode'", () => {
        render(<MultiplayerMenu />);

        fireEvent.click(screen.getByText("1 vs 1"));

        const changeModeBtn = screen.getByText("Change Mode");
        fireEvent.click(changeModeBtn);

        expect(gameQueue.emit).toHaveBeenCalledWith("leave");
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["queue"] });
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
});

describe("MultiplayerMenu - WebSocket Game Joined Events", () => {
    const mockNavigate = vi.fn();
    const mockSetIsJoined = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (gameQueue as any).listeners = {};
        (gameRoom as any).listeners = {};
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useMultiplayerContext).mockReturnValue({
            setIsJoined: mockSetIsJoined,
        } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(true);
        vi.mocked(useQuery).mockReturnValue({ data: null } as any);
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
    });

    it("subscribes to game_joined events on mount", () => {
        render(<MultiplayerMenu />);

        expect(gameRoom.on).toHaveBeenCalledWith("game_joined", expect.any(Function));
        expect(gameQueue.on).toHaveBeenCalledWith("game_joined", expect.any(Function));
    });

    it("unsubscribes from game_joined events on unmount", () => {
        const { unmount } = render(<MultiplayerMenu />);

        unmount();

        expect(gameRoom.off).toHaveBeenCalledWith("game_joined", expect.any(Function));
        expect(gameQueue.off).toHaveBeenCalledWith("game_joined", expect.any(Function));
    });

    it("triggers handleJoinGame when gameRoom emits game_joined", () => {
        render(<MultiplayerMenu />);

        const handleJoinGame = (gameRoom.on as any).mock.calls.find(
            (call: any) => call[0] === "game_joined"
        )[1];

        handleJoinGame();

        expect(mockSetIsJoined).toHaveBeenCalledWith(true);
        expect(mockNavigate).toHaveBeenCalledWith("/multiplayer-game");
    });

    it("triggers handleJoinGame when gameQueue emits game_joined", () => {
        render(<MultiplayerMenu />);

        const handleJoinGame = (gameQueue.on as any).mock.calls.find(
            (call: any) => call[0] === "game_joined"
        )[1];

        handleJoinGame();

        expect(mockSetIsJoined).toHaveBeenCalledWith(true);
        expect(mockNavigate).toHaveBeenCalledWith("/multiplayer-game");
    });
});

describe("MultiplayerMenu - Edge Cases & CSS Classes", () => {
    const mockNavigate = vi.fn();
    const mockSetIsJoined = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (gameQueue as any).listeners = {};
        (gameRoom as any).listeners = {};
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useMultiplayerContext).mockReturnValue({
            setIsJoined: mockSetIsJoined,
        } as any);
        vi.mocked(useOnlineStatus).mockReturnValue(true);
        vi.mocked(useQuery).mockReturnValue({ data: null } as any);
        vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
    });

    it("has correct full-screen container styles", () => {
        const { container } = render(<MultiplayerMenu />);
        const rootDiv = container.firstChild as HTMLElement;

        expect(rootDiv).toHaveClass(
            "relative",
            "w-screen",
            "h-screen",
            "overflow-hidden",
            "bg-game-bg"
        );
    });

    it("renders 1v1 badge with 'Duel' text", () => {
        render(<MultiplayerMenu />);
        expect(screen.getByText("Duel")).toBeInTheDocument();
    });

    it("renders 2v2 badge with 'Team' text", () => {
        render(<MultiplayerMenu />);
        expect(screen.getByText("Team")).toBeInTheDocument();
    });

    it("matches DOM snapshot for default state", () => {
        const { container } = render(<MultiplayerMenu />);
        expect(container).toMatchSnapshot();
    });

    it("matches DOM snapshot when mode is selected", () => {
        const { container } = render(<MultiplayerMenu />);
        fireEvent.click(screen.getByText("1 vs 1"));
        expect(container).toMatchSnapshot();
    });
});