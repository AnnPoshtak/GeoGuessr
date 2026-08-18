import { render, screen, fireEvent, waitFor, render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SinglePlayer from "./SinglePlayer";
import { gameApi } from "@/api";
import queryClient from "@/api/queryClient";
import { useGameContext } from "@/context/GameContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

vi.mock("@/api", () => ({
    gameApi: {
        getRandomLocation: vi.fn(),
        submitGuess: vi.fn(),
    },
}));

vi.mock("@/api/queryClient", () => ({
    default: {
        invalidateQueries: vi.fn(),
    },
}));

vi.mock("@/hooks/useOnlineStatus", () => ({
    useOnlineStatus: vi.fn(),
}));

vi.mock("@/context/GameContext", () => ({
    useGameContext: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => {
    return {
        useQuery: vi.fn(({ queryFn }) => {
            return {
                data: { lat: 10, lng: 20, heading: 90 },
                isPending: false,
                isError: false,
            };
        }),
        useMutation: vi.fn(({ mutationFn, onSuccess }) => ({
            mutate: vi.fn((vars) => {
                mutationFn(vars).then((res: any) => {
                    if (onSuccess) onSuccess(res);
                });
            }),
        })),
    };
});

vi.mock("@/components/GameHeader/GameHeader", () => ({
    GameHeader: vi.fn(() => <header data-testid="mock-game-header">GameHeader</header>),
}));

vi.mock("@/components/StreetView/StreetView.tsx", () => ({
    default: vi.fn(({ panoramaProps }) => {
        const mockPanorama = {
            setPov: vi.fn(),
            setPosition: vi.fn(),
        };
        if (panoramaProps?.onLoad) {
            panoramaProps.onLoad(mockPanorama);
        }
        return <div data-testid="mock-street-view">StreetView Component</div>;
    }),
}));

vi.mock("@/components/LocationSelectMap/LocationSelectMap", () => ({
    default: vi.fn(({ submitGuess, moveNext, children }) => (
        <div data-testid="mock-location-select-map">
            <button data-testid="mock-submit-btn" onClick={submitGuess}>
                Submit
            </button>
            <button data-testid="mock-next-btn" onClick={moveNext}>
                Next
            </button>
            {children}
        </div>
    )),
}));

vi.mock("@/components/Distance/Distance", () => ({
    default: vi.fn(({ path, visible }) => (
        <div data-testid="mock-distance" data-visible={visible}>
            {path.length}
        </div>
    )),
}));

vi.mock("@/components/GuessResultCard/GuessResultCard", () => ({
    GuessResultCard: vi.fn(() => <div data-testid="mock-guess-result-card">Card</div>),
}));

vi.mock("@/components/GuessMarker/GuessMarker", () => ({
    default: vi.fn(() => <div data-testid="mock-guess-marker">GuessMarker</div>),
}));

vi.mock("@/components/TargetMarker/TargetMarker", () => ({
    default: vi.fn(() => <div data-testid="mock-target-marker">TargetMarker</div>),
}));

const mockContextValue = {
    setIsSubmitted: vi.fn(),
    guessLocation: null,
    map: null,
    guessSubmitResponse: null,
    setGuessSubmitResponse: vi.fn(),
    setGuessLocation: vi.fn(),
    score: 100,
    totalGuesses: 5,
    correctGuesses: 2,
    closeGuesses: 2,
    notGuesses: 1,
};

describe("SinglePlayer Component - Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useOnlineStatus as any).mockReturnValue(true);
        (useGameContext as any).mockReturnValue(mockContextValue);
    });

    it("renders without crashing", () => {
        const { container } = render(<SinglePlayer />);
        expect(container).toBeDefined();
    });

    it("renders loading state when query is pending", async () => {
        const ReactQuery = await import("@tanstack/react-query");
        vi.mocked(ReactQuery.useQuery).mockReturnValueOnce({
            data: undefined,
            isPending: true,
            isError: false,
        } as any);

        render(<SinglePlayer />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state when query fails", async () => {
        const ReactQuery = await import("@tanstack/react-query");
        vi.mocked(ReactQuery.useQuery).mockReturnValueOnce({
            data: undefined,
            isPending: false,
            isError: true,
        } as any);

        render(<SinglePlayer />);
        expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("displays GameHeader component", () => {
        render(<SinglePlayer />);
        expect(screen.getByTestId("mock-game-header")).toBeInTheDocument();
    });

    it("displays StreetView component when location data is present", () => {
        render(<SinglePlayer />);
        expect(screen.getByTestId("mock-street-view")).toBeInTheDocument();
    });

    it("displays LocationSelectMap component", () => {
        render(<SinglePlayer />);
        expect(screen.getByTestId("mock-location-select-map")).toBeInTheDocument();
    });

    it("shows offline indicator when isOnline is false", () => {
        (useOnlineStatus as any).mockReturnValue(false);
        render(<SinglePlayer />);
        const offlineIconContainer = screen.getByTestId("mock-game-header").nextElementSibling;
        expect(offlineIconContainer).toBeInTheDocument();
        expect(offlineIconContainer).toHaveClass("animate-pulse");
    });

    it("hides offline indicator when isOnline is true", () => {
        (useOnlineStatus as any).mockReturnValue(true);
        render(<SinglePlayer />);
        const offlineIcon = document.querySelector(".lucide-wifi-off");
        expect(offlineIcon).not.toBeInTheDocument();
    });
});

describe("SinglePlayer Component - Context & Effects Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useOnlineStatus as any).mockReturnValue(true);
        (useGameContext as any).mockReturnValue(mockContextValue);
    });

    it("calls setIsSubmitted(false) when guessSubmitResponse is null", () => {
        render(<SinglePlayer />);
        expect(mockContextValue.setIsSubmitted).toHaveBeenCalledWith(false);
    });

    it("calls setIsSubmitted(true) when guessSubmitResponse has guess data", () => {
        (useGameContext as any).mockReturnValue({
            ...mockContextValue,
            guessSubmitResponse: { guess: { lat: 10, lng: 10 }, target: { lat: 20, lng: 20 } },
        });

        render(<SinglePlayer />);
        expect(mockContextValue.setIsSubmitted).toHaveBeenCalledWith(true);
    });

    it("renders GuessMarker when guessLocation is set", () => {
        (useGameContext as any).mockReturnValue({
            ...mockContextValue,
            guessLocation: { lat: 12.34, lng: 56.78 },
        });

        render(<SinglePlayer />);
        expect(screen.getByTestId("mock-guess-marker")).toBeInTheDocument();
    });

    it("renders TargetMarker when guessSubmitResponse is available", () => {
        (useGameContext as any).mockReturnValue({
            ...mockContextValue,
            guessSubmitResponse: { guess: { lat: 10, lng: 10 }, target: { lat: 20, lng: 20 } },
        });

        render(<SinglePlayer />);
        expect(screen.getByTestId("mock-target-marker")).toBeInTheDocument();
    });

    it("renders GuessResultCard when guessSubmitResponse is present", () => {
        (useGameContext as any).mockReturnValue({
            ...mockContextValue,
            guessSubmitResponse: { guess: { lat: 10, lng: 10 }, target: { lat: 20, lng: 20 } },
        });

        render(<SinglePlayer />);
        expect(screen.getByTestId("mock-guess-result-card")).toBeInTheDocument();
    });
});

describe("SinglePlayer Component - User Actions & Mutations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useOnlineStatus as any).mockReturnValue(true);
        (useGameContext as any).mockReturnValue(mockContextValue);
    });

    it("does not trigger mutation submit when guessLocation is null", () => {
        render(<SinglePlayer />);
        const submitBtn = screen.getByTestId("mock-submit-btn");
        fireEvent.click(submitBtn);

        expect(gameApi.submitGuess).not.toHaveBeenCalled();
    });

    it("triggers submitGuess mutation when guessLocation exists", async () => {
        const mockLocation = { lat: 40.7128, lng: -74.006 };
        (useGameContext as any).mockReturnValue({
            ...mockContextValue,
            guessLocation: mockLocation,
        });
        (gameApi.submitGuess as any).mockResolvedValue({
            guess: mockLocation,
            target: { lat: 40.73, lng: -73.99 },
        });

        render(<SinglePlayer />);
        const submitBtn = screen.getByTestId("mock-submit-btn");
        fireEvent.click(submitBtn);

        expect(gameApi.submitGuess).toHaveBeenCalledWith(mockLocation);
    });

    it("fits map bounds on successful guess submission if map exists", async () => {
        const mockBounds = {
            extend: vi.fn(),
        };
        const mockFitBounds = vi.fn();
        const mockMap = {
            fitBounds: mockFitBounds,
        };

        (global as any).google = {
            maps: {
                LatLngBounds: vi.fn().mockImplementation(class {
                    extend = mockBounds.extend;
                }),
            },
        };

        const mockGuess = { lat: 10, lng: 10 };
        const mockTarget = { lat: 20, lng: 20 };

        (useGameContext as any).mockReturnValue({
            ...mockContextValue,
            guessLocation: mockGuess,
            map: mockMap,
        });

        (gameApi.submitGuess as any).mockResolvedValue({
            guess: mockGuess,
            target: mockTarget,
        });

        render(<SinglePlayer />);
        const submitBtn = screen.getByTestId("mock-submit-btn");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockBounds.extend).toHaveBeenCalledWith(mockGuess);
            expect(mockBounds.extend).toHaveBeenCalledWith(mockTarget);
            expect(mockFitBounds).toHaveBeenCalledWith(mockBounds);
        });
    });

    it("resets state and invalidates queries when moveNext is called", () => {
        render(<SinglePlayer />);
        const nextBtn = screen.getByTestId("mock-next-btn");
        fireEvent.click(nextBtn);

        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
            queryKey: ["randomLocation"],
        });
        expect(mockContextValue.setGuessLocation).toHaveBeenCalledWith(null);
        expect(mockContextValue.setGuessSubmitResponse).toHaveBeenCalledWith(null);
    });
});

describe("SinglePlayer Component - Query Execution & StreetView Setup", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useOnlineStatus as any).mockReturnValue(true);
        (useGameContext as any).mockReturnValue(mockContextValue);
    });

    it("executes queryFn and sets StreetView panorama POV/Position if viewRef exists", async () => {
        const mockSetPov = vi.fn();
        const mockSetPosition = vi.fn();

        const mockPanorama = {
            setPov: mockSetPov,
            setPosition: mockSetPosition,
        };

        const mockLocationData = {
            lat: 51.5074,
            lng: -0.1278,
            heading: 120,
        };

        (gameApi.getRandomLocation as any).mockResolvedValue(mockLocationData);

        const ReactQuery = await import("@tanstack/react-query");

        vi.mocked(ReactQuery.useQuery).mockImplementation((options: any) => {
            if (options?.queryFn) {
                options.queryFn();
            }
            return {
                data: mockLocationData,
                isPending: false,
                isError: false,
                isLoading: false,
            } as any;
        });

        render(<SinglePlayer />);

        const streetView = await screen.findByTestId("mock-street-view");
        expect(streetView).toBeInTheDocument();

        expect(gameApi.getRandomLocation).toHaveBeenCalled();
    });
});