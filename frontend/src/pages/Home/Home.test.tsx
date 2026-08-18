import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "./Home";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/components/Header/Header", () => ({
  Header: vi.fn(() => <header data-testid="mock-header">Header Component</header>),
}));

vi.mock("@/components/EarthGlobe/EarthGlobe", () => ({
  default: vi.fn(() => <div data-testid="mock-earth-globe">Earth Globe Component</div>),
}));

describe("Home Component - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<Home />);
    expect(container).toBeDefined();
  });

  it("renders Header component inside relative z-30 wrapper", () => {
    render(<Home />);
    const header = screen.getByTestId("mock-header");
    expect(header).toBeInTheDocument();
    expect(header.parentElement).toHaveClass("relative z-30 w-full");
  });

  it("renders EarthGlobe component", () => {
    render(<Home />);
    const globe = screen.getByTestId("mock-earth-globe");
    expect(globe).toBeInTheDocument();
  });

  it("renders main heading text", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("Discover the");
    expect(heading.textContent).toContain("unknown");
    expect(heading.textContent).toContain("world");
  });

  it("renders highlighted word 'unknown' with accent styling class", () => {
    render(<Home />);
    const span = screen.getByText("unknown");
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass("text-accent");
  });

  it("renders main paragraph description text", () => {
    render(<Home />);
    const paragraph = screen.getByText(
      "Test your intuition, guess the locations, and embark on an exciting journey across continents."
    );
    expect(paragraph).toBeInTheDocument();
  });

  it("renders Singleplayer button heading and description", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 3, name: "Singleplayer" })).toBeInTheDocument();
    expect(screen.getByText("Explore the world on your own")).toBeInTheDocument();
  });

  it("renders Multiplayer button heading and description", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 3, name: "Multiplayer" })).toBeInTheDocument();
    expect(screen.getByText("Compete with other players")).toBeInTheDocument();
  });

  it("renders arrow indicators in both mode buttons", () => {
    render(<Home />);
    const arrows = screen.getAllByText("➔");
    expect(arrows).toHaveLength(2);
  });

  it("renders exactly two mode selection buttons", () => {
    render(<Home />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });
});

describe("Home Component - Navigation & User Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to '/single-game' when Singleplayer button is clicked", () => {
    render(<Home />);
    const singleplayerButton = screen.getByRole("button", { name: /singleplayer/i });
    fireEvent.click(singleplayerButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/single-game");
  });

  it("navigates to '/multiplayer' when Multiplayer button is clicked", () => {
    render(<Home />);
    const multiplayerButton = screen.getByRole("button", { name: /multiplayer/i });
    fireEvent.click(multiplayerButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/multiplayer");
  });

  it("navigates when Singleplayer inner elements (heading/description) are clicked", () => {
    render(<Home />);
    const singleplayerText = screen.getByText("Explore the world on your own");
    fireEvent.click(singleplayerText);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/single-game");
  });

  it("navigates when Multiplayer inner elements (heading/description) are clicked", () => {
    render(<Home />);
    const multiplayerText = screen.getByText("Compete with other players");
    fireEvent.click(multiplayerText);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/multiplayer");
  });

  it("does not navigate when text card background is clicked", () => {
    render(<Home />);
    const cardHeading = screen.getByRole("heading", { level: 2 });
    fireEvent.click(cardHeading);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not navigate when EarthGlobe wrapper is clicked", () => {
    render(<Home />);
    const globe = screen.getByTestId("mock-earth-globe");
    fireEvent.click(globe);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("Home Component - Layout, CSS & Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has main layout full-screen container classes", () => {
    const { container } = render(<Home />);
    const mainDiv = container.firstChild as HTMLElement;

    expect(mainDiv).toHaveClass("relative", "w-screen", "h-screen", "overflow-hidden", "bg-game-bg");
  });

  it("contains overlay gradient background element with pointer-events-none", () => {
    const { container } = render(<Home />);
    const overlay = container.querySelector(".pointer-events-none");

    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("absolute", "inset-0", "z-0");
  });

  it("wraps EarthGlobe inside specific responsive sizing dimensions container", () => {
    render(<Home />);
    const globe = screen.getByTestId("mock-earth-globe");
    const parentContainer = globe.parentElement;

    expect(parentContainer).toHaveClass(
      "w-[300px]",
      "h-[300px]",
      "sm:w-[380px]",
      "sm:h-[380px]",
      "md:w-[480px]",
      "md:h-[480px]"
    );
  });

  it("matches DOM snapshot", () => {
    const { container } = render(<Home />);
    expect(container).toMatchSnapshot();
  });
});