import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Home from './Home';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/ControlPanel/ControlPanel', () => ({
  Dropdown: () => <div data-testid="mock-dropdown">Dropdown</div>,
}));

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  test('renders header title and description', () => {
    render(<Home />);
    
    const titleElement = screen.getByRole('heading', { name: /geoguessr/i });
    const descriptionElement = screen.getByText(/a geography game which takes you on a journey/i);
    
    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  test('renders dropdown component', () => {
    render(<Home />);
    
    const dropdown = screen.getByTestId('mock-dropdown');
    expect(dropdown).toBeInTheDocument();
  });

  test('renders navigation buttons', () => {
    render(<Home />);
    
    const singlePlayerButton = screen.getByRole('button', { name: /single player/i });
    const multiplayerButton = screen.getByRole('button', { name: /multiplayer/i });
    
    expect(singlePlayerButton).toBeInTheDocument();
    expect(multiplayerButton).toBeInTheDocument();
  });

  test('navigates to single game route on button click', () => {
    render(<Home />);
    
    const singlePlayerButton = screen.getByRole('button', { name: /single player/i });
    fireEvent.click(singlePlayerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/single-game');
  });

  test('navigates to multiplayer route on button click', () => {
    render(<Home />);
    
    const multiplayerButton = screen.getByRole('button', { name: /multiplayer/i });
    fireEvent.click(multiplayerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/multiplayer');
  });

  test('triggers mouse move event without crashing', () => {
    const { container } = render(<Home />);
    const mainDiv = container.firstChild;
    
    expect(() => {
      fireEvent.mouseMove(mainDiv!, { clientX: 100, clientY: 100 });
    }).not.toThrow();
  });
});