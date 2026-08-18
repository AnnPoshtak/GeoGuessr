import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LocationSelectMap from "./LocationSelectMap";

const mockUseJsApiLoader = vi.fn();
const mockSetGuessLocation = vi.fn();
const mockSetMap = vi.fn();

let mockGameContext = {
  isSubmitted: false,
  guessLocation: null as { lat: number; lng: number } | null,
  setGuessLocation: mockSetGuessLocation,
  setMap: mockSetMap,
};

vi.mock("@/context/GameContext", () => ({
  useGameContext: () => mockGameContext,
}));

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: (options: unknown) => mockUseJsApiLoader(options),
  GoogleMap: vi.fn(({ children, onLoad, onClick, mapContainerClassName, options, center, zoom }) => {
    if (onLoad) {
      onLoad({ fakeMapInstance: true });
    }
    return (
      <div
        data-testid="google-map"
        className={mapContainerClassName}
        data-zoom={zoom}
        data-center={JSON.stringify(center)}
        data-options={JSON.stringify(options)}
        onClick={(e) => {
          if (onClick) {
            onClick({
              latLng: {
                lat: () => 50.45,
                lng: () => 30.52,
              },
            });
          }
        }}
      >
        {children}
      </div>
    );
  }),
}));

import { GoogleMap } from "@react-google-maps/api";

describe("LocationSelectMap - Loading & Error States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext = {
      isSubmitted: false,
      guessLocation: null,
      setGuessLocation: mockSetGuessLocation,
      setMap: mockSetMap,
    };
  });

  it("passes correct config to useJsApiLoader", () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: undefined });
    render(
      <LocationSelectMap apiKey="test-key-123" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    expect(mockUseJsApiLoader).toHaveBeenCalledWith({
      id: "google-map-script",
      googleMapsApiKey: "test-key-123",
    });
  });

  it("renders loading state when map is not loaded", () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: undefined });
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );

    expect(screen.getByText("Loading map...")).toBeInTheDocument();
    expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
  });

  it("renders error state when loadError is present", () => {
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: false,
      loadError: new Error("Failed to load map"),
    });
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );

    expect(screen.getByText("Map loading error")).toBeInTheDocument();
    expect(screen.queryByText("Loading map...")).not.toBeInTheDocument();
    expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
  });

  it("renders error state when both loadError and isLoaded are true", () => {
    mockUseJsApiLoader.mockReturnValue({
      isLoaded: true,
      loadError: new Error("Failed"),
    });
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );

    expect(screen.getByText("Map loading error")).toBeInTheDocument();
  });
});

describe("LocationSelectMap - Rendering & Map Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext = {
      isSubmitted: false,
      guessLocation: null,
      setGuessLocation: mockSetGuessLocation,
      setMap: mockSetMap,
    };
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: undefined });
  });

  it("renders map container when loaded", () => {
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });

  it("calls setMap on GoogleMap load", () => {
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    expect(mockSetMap).toHaveBeenCalledWith({ fakeMapInstance: true });
  });

  it("passes default center { lat: 0, lng: 0 } and zoom 1.5 to GoogleMap", () => {
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    const lastCall = vi.mocked(GoogleMap).mock.calls.at(-1);
    expect(lastCall?.[0].center).toEqual({ lat: 0, lng: 0 });
    expect(lastCall?.[0].zoom).toBe(1.5);
  });

  it("passes disableDefaultUI, draggableCursor and draggingCursor options", () => {
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    const lastCall = vi.mocked(GoogleMap).mock.calls.at(-1);
    expect(lastCall?.[0].options).toEqual({
      disableDefaultUI: true,
      draggableCursor: "crosshair",
      draggingCursor: "crosshair",
    });
  });

  it("applies additional className to the container when provided", () => {
    const { container } = render(
      <LocationSelectMap
        apiKey="test-key"
        className="custom-class-123"
        moveNext={vi.fn()}
        submitGuess={vi.fn()}
      />
    );
    expect(container.firstChild).toHaveClass("custom-class-123");
  });

  it("renders children inside GoogleMap", () => {
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()}>
        <div data-testid="child-element">Child Marker</div>
      </LocationSelectMap>
    );
    expect(screen.getByTestId("child-element")).toBeInTheDocument();
  });
});

describe("LocationSelectMap - Marker Creation & Map Clicks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext = {
      isSubmitted: false,
      guessLocation: null,
      setGuessLocation: mockSetGuessLocation,
      setMap: mockSetMap,
    };
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: undefined });
  });

  it("sets guess location on map click when not submitted", () => {
    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    const map = screen.getByTestId("google-map");
    fireEvent.click(map);

    expect(mockSetGuessLocation).toHaveBeenCalledTimes(1);
    expect(mockSetGuessLocation).toHaveBeenCalledWith({
      lat: 50.45,
      lng: 30.52,
    });
  });

  it("does not set guess location when isSubmitted is true", () => {
    mockGameContext.isSubmitted = true;

    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    const map = screen.getByTestId("google-map");
    fireEvent.click(map);

    expect(mockSetGuessLocation).not.toHaveBeenCalled();
  });

  it("does not call setGuessLocation if latLng is missing in map event", () => {
    const customGoogleMap = vi.mocked(GoogleMap);
    customGoogleMap.mockImplementationOnce(({ children, onClick }: any) => (
      <div
        data-testid="google-map-empty-event"
        onClick={() => onClick && onClick({})}
      >
        {children}
      </div>
    ));

    render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId("google-map-empty-event"));

    expect(mockSetGuessLocation).not.toHaveBeenCalled();
  });
});

describe("LocationSelectMap - Button & Mode Controls", () => {
  const mockMoveNext = vi.fn();
  const mockSubmitGuess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext = {
      isSubmitted: false,
      guessLocation: null,
      setGuessLocation: mockSetGuessLocation,
      setMap: mockSetMap,
    };
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: undefined });
  });

  it("renders submit button disabled when not submitted and guessLocation is null", () => {
    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
      />
    );

    const btn = screen.getByRole("button", { name: "Submit guess!" });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("enables submit button when guessLocation exists and isSubmitted is false", () => {
    mockGameContext.guessLocation = { lat: 10, lng: 20 };

    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
      />
    );

    const btn = screen.getByRole("button", { name: "Submit guess!" });
    expect(btn).toBeEnabled();
  });

  it("calls submitGuess when enabled submit button is clicked", () => {
    mockGameContext.guessLocation = { lat: 10, lng: 20 };

    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
      />
    );

    const btn = screen.getByRole("button", { name: "Submit guess!" });
    fireEvent.click(btn);

    expect(mockSubmitGuess).toHaveBeenCalledTimes(1);
    expect(mockMoveNext).not.toHaveBeenCalled();
  });

  it("renders Next Round button when isSubmitted is true and isMoveNextBtnEnabled is true", () => {
    mockGameContext.isSubmitted = true;

    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
        isMoveNextBtnEnabled={true}
      />
    );

    expect(screen.queryByRole("button", { name: "Submit guess!" })).not.toBeInTheDocument();
    const nextBtn = screen.getByRole("button", { name: "Next Round!" });
    expect(nextBtn).toBeInTheDocument();
  });

  it("calls moveNext when Next Round button is clicked", () => {
    mockGameContext.isSubmitted = true;

    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
        isMoveNextBtnEnabled={true}
      />
    );

    const nextBtn = screen.getByRole("button", { name: "Next Round!" });
    fireEvent.click(nextBtn);

    expect(mockMoveNext).toHaveBeenCalledTimes(1);
    expect(mockSubmitGuess).not.toHaveBeenCalled();
  });

  it("renders Submit button disabled if isSubmitted is true but isMoveNextBtnEnabled is false/undefined", () => {
    mockGameContext.isSubmitted = true;
    mockGameContext.guessLocation = { lat: 10, lng: 20 };

    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
        isMoveNextBtnEnabled={false}
      />
    );

    const btn = screen.getByRole("button", { name: "Submit guess!" });
    expect(btn).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Next Round!" })).not.toBeInTheDocument();
  });

  it("hides button controls completely when isMultiplayer is true", () => {
    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
        isMultiplayer={true}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit guess!")).not.toBeInTheDocument();
    expect(screen.queryByText("Next Round!")).not.toBeInTheDocument();
  });

  it("hides button controls in multiplayer even if isSubmitted and isMoveNextBtnEnabled are true", () => {
    mockGameContext.isSubmitted = true;

    render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={mockMoveNext}
        submitGuess={mockSubmitGuess}
        isMoveNextBtnEnabled={true}
        isMultiplayer={true}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("LocationSelectMap - Integration & Re-renders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameContext = {
      isSubmitted: false,
      guessLocation: null,
      setGuessLocation: mockSetGuessLocation,
      setMap: mockSetMap,
    };
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: undefined });
  });

  it("switches from Submit to Next Round button dynamically when context changes", () => {
    mockGameContext.guessLocation = { lat: 10, lng: 20 };

    const { rerender } = render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={vi.fn()}
        submitGuess={vi.fn()}
        isMoveNextBtnEnabled={true}
      />
    );

    expect(screen.getByRole("button", { name: "Submit guess!" })).toBeInTheDocument();

    mockGameContext.isSubmitted = true;
    rerender(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={vi.fn()}
        submitGuess={vi.fn()}
        isMoveNextBtnEnabled={true}
      />
    );

    expect(screen.queryByRole("button", { name: "Submit guess!" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next Round!" })).toBeInTheDocument();
  });

  it("matches snapshot when loading", () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: undefined });
    const { container } = render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when error occurs", () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error("err") });
    const { container } = render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when fully loaded in default singleplayer mode", () => {
    const { container } = render(
      <LocationSelectMap apiKey="test-key" moveNext={vi.fn()} submitGuess={vi.fn()} />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when in multiplayer mode", () => {
    const { container } = render(
      <LocationSelectMap
        apiKey="test-key"
        moveNext={vi.fn()}
        submitGuess={vi.fn()}
        isMultiplayer={true}
      />
    );
    expect(container).toMatchSnapshot();
  });
});