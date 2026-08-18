import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GameContent from "./GameContent";
import fetchGame from "@/ws/fetchGame";
import submitGuess from "@/ws/submitGuess";
import queryClient from "@/api/queryClient";
import { useMultiplayerContext } from "@/context/MultiplayerContext";
import { useUser } from "@/context/UserContext";
import { useGameContext } from "@/context/GameContext";
import { useGameEvents } from "@/hooks/useGameEvents";
import { useQuery } from "@tanstack/react-query";

vi.mock("@/ws/fetchGame", () => ({
  default: vi.fn(),
}));

vi.mock("@/ws/submitGuess", () => ({
  default: vi.fn(),
}));

vi.mock("@/api/queryClient", () => ({
  default: {
    invalidateQueries: vi.fn(),
  },
}));

vi.mock("@/context/MultiplayerContext", () => ({
  useMultiplayerContext: vi.fn(),
}));

vi.mock("@/context/UserContext", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/context/GameContext", () => ({
  useGameContext: vi.fn(),
}));

vi.mock("@/hooks/useGameEvents", () => ({
  useGameEvents: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/components/MultiplayerScorebar/MultiplayerScorebar", () => ({
  MultiplayerScorebar: vi.fn(({ autosubmitSeconds, currentUserId }) => (
    <div data-testid="mock-scorebar">
      Scorebar - User: {currentUserId} - Seconds: {autosubmitSeconds}
    </div>
  )),
}));

vi.mock("@/components/StreetView/StreetView", () => ({
  default: vi.fn(({ panoramaProps }) => {
    const mockPanorama = {
      setPov: vi.fn(),
      setPosition: vi.fn(),
    };
    if (panoramaProps?.onLoad) {
      panoramaProps.onLoad(mockPanorama);
    }
    return <div data-testid="mock-street-view">Street View Component</div>;
  }),
}));

vi.mock("@/pages/MultiPlayer/components/GameEndScreen", () => ({
  default: vi.fn(({ onClose }) => (
    <div data-testid="mock-game-end-screen">
      <span>Game End Screen</span>
      <button data-testid="mock-end-screen-close" onClick={onClose}>
        Close End Screen
      </button>
    </div>
  )),
}));

vi.mock("@/components/LocationSelectMap/LocationSelectMap", () => ({
  default: vi.fn(({ submitGuess, children }) => (
    <div data-testid="mock-location-select-map">
      <button data-testid="mock-inner-submit-btn" onClick={submitGuess}>
        Submit Location
      </button>
      {children}
    </div>
  )),
}));

vi.mock("@/components/TargetMarker/TargetMarker", () => ({
  default: vi.fn(({ position }) => (
    <div data-testid="mock-target-marker">Target Marker: {position?.lat}</div>
  )),
}));

vi.mock("@/components/Distance/Distance", () => ({
  default: vi.fn(({ path, visible }) => (
    <div data-testid="mock-distance" data-visible={visible}>
      Distance Path Length: {path?.length}
    </div>
  )),
}));

vi.mock("@/components/GuessMarker/GuessMarker", () => ({
  default: vi.fn(({ position }) => (
    <div data-testid="mock-guess-marker">Guess Marker: {position?.lat}</div>
  )),
}));

vi.mock("@/components/MultiplayerControls/MultiplayerControls", () => ({
  MultiplayerControls: vi.fn(({ submit, isSubmitted, isAllReady }) => (
    <div data-testid="mock-multiplayer-controls">
      <button data-testid="mock-controls-submit-btn" onClick={submit}>
        Submit Control
      </button>
      <span data-testid="mock-submitted-status">{isSubmitted ? "Submitted" : "Not Submitted"}</span>
      <span data-testid="mock-ready-status">{isAllReady ? "All Ready" : "Not Ready"}</span>
    </div>
  )),
}));

describe("GameContent - Unit & Component Rendering Tests", () => {
  const mockSetGuessLocation = vi.fn();
  const mockSetIsSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: true,
    } as any);
    vi.mocked(useUser).mockReturnValue({
      user: { id: 1, username: "Player1" },
    } as any);
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: null,
      map: null,
      setGuessLocation: mockSetGuessLocation,
      isSubmitted: false,
      setIsSubmitted: mockSetIsSubmitted,
    } as any);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);
  });

  it("renders base layout without crashing", () => {
    const { container } = render(<GameContent />);
    expect(container).toBeDefined();
  });

  it("renders MultiplayerScorebar when isJoined is true", () => {
    render(<GameContent />);
    expect(screen.getByTestId("mock-scorebar")).toBeInTheDocument();
  });

  it("does not render MultiplayerScorebar when isJoined is false", () => {
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: false,
    } as any);

    render(<GameContent />);
    expect(screen.queryByTestId("mock-scorebar")).not.toBeInTheDocument();
  });

  it("renders StreetView component", () => {
    render(<GameContent />);
    expect(screen.getByTestId("mock-street-view")).toBeInTheDocument();
  });

  it("renders LocationSelectMap component", () => {
    render(<GameContent />);
    expect(screen.getByTestId("mock-location-select-map")).toBeInTheDocument();
  });

  it("renders MultiplayerControls when isJoined is true and game is not ended", () => {
    render(<GameContent />);
    expect(screen.getByTestId("mock-multiplayer-controls")).toBeInTheDocument();
  });

  it("does not render MultiplayerControls when isJoined is false", () => {
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: false,
    } as any);

    render(<GameContent />);
    expect(screen.queryByTestId("mock-multiplayer-controls")).not.toBeInTheDocument();
  });

  it("registers useGameEvents hook with provided properties", () => {
    render(<GameContent />);
    expect(useGameEvents).toHaveBeenCalledWith({
      isJoined: true,
      gameKey: "game-key-123",
      map: null,
      viewRef: expect.any(Object),
      onNewRound: expect.any(Function),
      onGameEnd: expect.any(Function),
      setGameState: expect.any(Function),
      setIsPlayerConnected: expect.any(Function),
    });
  });
});

describe("GameContent - React Query Integration & Initial Game Load", () => {
  const mockSetGuessLocation = vi.fn();
  const mockSetIsSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: true,
    } as any);
    vi.mocked(useUser).mockReturnValue({
      user: { id: 1, username: "Player1" },
    } as any);
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: null,
      map: null,
      setGuessLocation: mockSetGuessLocation,
      isSubmitted: false,
      setIsSubmitted: mockSetIsSubmitted,
    } as any);
  });

  it("executes queryFn and initializes game state when game data fetches", async () => {
    const mockGameData = {
      target: { lat: 10, lng: 20, heading: 90 },
      guess: { lat: 12, lng: 22 },
      teams: [
        {
          id: 1,
          players: [{ id: 1, guess: { lat: 12, lng: 22 } }],
        },
      ],
      autosubmit_seconds: 15,
    };

    (fetchGame as any).mockResolvedValue(mockGameData);

    vi.mocked(useQuery).mockImplementation((options: any) => {
      options.queryFn();
      return { data: mockGameData } as any;
    });

    render(<GameContent />);

    await waitFor(() => {
      expect(fetchGame).toHaveBeenCalled();
      expect(mockSetGuessLocation).toHaveBeenCalledWith({ lat: 12, lng: 22 });
      expect(mockSetIsSubmitted).toHaveBeenCalledWith(true);
    });
  });
});

describe("GameContent - User Interaction & Guess Submission", () => {
  const mockSetGuessLocation = vi.fn();
  const mockSetIsSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: true,
    } as any);
    vi.mocked(useUser).mockReturnValue({
      user: { id: 1, username: "Player1" },
    } as any);
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: { lat: 50.0, lng: 30.0 },
      map: null,
      setGuessLocation: mockSetGuessLocation,
      isSubmitted: false,
      setIsSubmitted: mockSetIsSubmitted,
    } as any);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);
  });

  it("does not submit guess if guessLocation is null", () => {
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: null,
      map: null,
      setGuessLocation: mockSetGuessLocation,
      isSubmitted: false,
      setIsSubmitted: mockSetIsSubmitted,
    } as any);

    render(<GameContent />);

    const submitBtn = screen.getByTestId("mock-controls-submit-btn");
    fireEvent.click(submitBtn);

    expect(submitGuess).not.toHaveBeenCalled();
    expect(mockSetIsSubmitted).not.toHaveBeenCalled();
  });

  it("submits guess location and updates submission status when guessLocation exists", () => {
    render(<GameContent />);

    const submitBtn = screen.getByTestId("mock-controls-submit-btn");
    fireEvent.click(submitBtn);

    expect(submitGuess).toHaveBeenCalledWith({ lat: 50.0, lng: 30.0 });
    expect(mockSetIsSubmitted).toHaveBeenCalledWith(true);
  });

  it("allows submitting guess via LocationSelectMap inner component trigger", () => {
    render(<GameContent />);

    const submitBtn = screen.getByTestId("mock-inner-submit-btn");
    fireEvent.click(submitBtn);

    expect(submitGuess).toHaveBeenCalledWith({ lat: 50.0, lng: 30.0 });
    expect(mockSetIsSubmitted).toHaveBeenCalledWith(true);
  });

  it("renders GuessMarker when guessLocation is present and round is active", () => {
    render(<GameContent />);
    expect(screen.getByTestId("mock-guess-marker")).toBeInTheDocument();
  });
});

describe("GameContent - Autosubmit Timer Effect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: true,
    } as any);
    vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: null,
      map: null,
      setGuessLocation: vi.fn(),
      isSubmitted: false,
      setIsSubmitted: vi.fn(),
    } as any);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe("GameContent - Game Events Callbacks (onNewRound & onGameEnd)", () => {
  const mockSetGuessLocation = vi.fn();
  const mockSetIsSubmitted = vi.fn();
  const mockExtend = vi.fn();
  const mockFitBounds = vi.fn();

  const mockMap = {
    fitBounds: mockFitBounds,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    class MockLatLngBounds {
      extend = mockExtend;
    }

    (global as any).google = {
      maps: {
        LatLngBounds: MockLatLngBounds,
      },
    };

    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: true,
    } as any);
    vi.mocked(useUser).mockReturnValue({
      user: { id: 10, username: "User10" },
    } as any);
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: null,
      map: mockMap,
      setGuessLocation: mockSetGuessLocation,
      isSubmitted: false,
      setIsSubmitted: mockSetIsSubmitted,
    } as any);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });


  it("handles onGameEnd event with string winner and shows GameEndScreen", () => {
    render(<GameContent />);

    const gameEventsArgs = vi.mocked(useGameEvents).mock.calls[0][0];
    const endGameData = {
      target: { lat: 10, lng: 10 },
      teams: [],
      scores: { 10: 5000 },
      winner: "Red Team",
    };

    act(() => {
      gameEventsArgs.onGameEnd(endGameData as any);
    });

    expect(screen.getByTestId("mock-game-end-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-location-select-map")).not.toBeInTheDocument();
  });

  it("handles onGameEnd event with object winner structure", () => {
    render(<GameContent />);

    const gameEventsArgs = vi.mocked(useGameEvents).mock.calls[0][0];
    const endGameData = {
      target: { lat: 10, lng: 10 },
      teams: [],
      scores: { 10: 5000 },
      winner: { teamName: "Blue Team" },
    };

    act(() => {
      gameEventsArgs.onGameEnd(endGameData as any);
    });

    expect(screen.getByTestId("mock-game-end-screen")).toBeInTheDocument();
  });

  it("allows closing GameEndScreen through onClose handler", () => {
    render(<GameContent />);

    const gameEventsArgs = vi.mocked(useGameEvents).mock.calls[0][0];
    act(() => {
      gameEventsArgs.onGameEnd({
        target: { lat: 0, lng: 0 },
        teams: [],
        scores: {},
        winner: "Winner",
      } as any);
    });

    const closeBtn = screen.getByTestId("mock-end-screen-close");
    fireEvent.click(closeBtn);

    expect(screen.getByTestId("mock-game-end-screen")).toBeInTheDocument();
  });
});

describe("GameContent - Styling & DOM Snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMultiplayerContext).mockReturnValue({
      gameKey: "game-key-123",
      isJoined: true,
    } as any);
    vi.mocked(useUser).mockReturnValue({ user: { id: 1 } } as any);
    vi.mocked(useGameContext).mockReturnValue({
      guessLocation: null,
      map: null,
      setGuessLocation: vi.fn(),
      isSubmitted: false,
      setIsSubmitted: vi.fn(),
    } as any);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);
  });

  it("has main container classes", () => {
    const { container } = render(<GameContent />);
    const rootDiv = container.firstChild as HTMLElement;

    expect(rootDiv).toHaveClass(
      "w-full",
      "h-full",
      "absolute",
      "inset-0",
      "bg-game-bg",
      "overflow-hidden"
    );
  });
});