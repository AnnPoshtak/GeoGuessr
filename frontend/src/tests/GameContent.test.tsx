import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GameContent from '../pages/MultiPlayer/GameContent';
import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { useGameContext } from '@/context/GameContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import fetchGame from '@/ws/fetchGame';
import submitGuess from '@/ws/submitGuess';
import queryClient from '@/api/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect } from 'react';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn() },
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
}));

vi.mock('@/api/queryClient', () => ({
    default: { invalidateQueries: vi.fn(() => Promise.resolve()) },
}));

vi.mock('@/context/MultiplayerContext', () => ({
    useMultiplayerContext: vi.fn(),
}));

vi.mock('@/context/GameContext', () => ({
    useGameContext: vi.fn(),
}));

vi.mock('@/ws/fetchGame', () => ({
    default: vi.fn(),
}));

vi.mock('@/ws/submitGuess', () => ({
    default: vi.fn(),
}));

vi.mock('@/ws/wsClient', () => ({
    gameQueue: { on: vi.fn(), off: vi.fn() },
    gameRoom: { on: vi.fn(), off: vi.fn() },
}));

const mockSetPov = vi.fn();
const mockSetPosition = vi.fn();
const mockStreetViewInstance = { setPov: mockSetPov, setPosition: mockSetPosition };

const mockExtend = vi.fn();
function MockLatLngBounds() {
    return { extend: mockExtend };
}

global.google = {
    maps: {
        LatLngBounds: MockLatLngBounds,
    },
} as any;

vi.mock('@/components/StreetView/StreetView', () => ({
    default: ({ panoramaProps }: any) => {
        useEffect(() => {
            if (panoramaProps?.onLoad) {
                panoramaProps.onLoad(mockStreetViewInstance);
            }
        }, []);
        return <div data-testid="street-view" />;
    },
}));

vi.mock('@/components/LocationSelectMap/LocationSelectMap', () => ({
    default: ({ children, submitGuess }: any) => (
        <div data-testid="location-select-map">
            <button data-testid="submit-guess-btn" onClick={submitGuess}>Submit Guess</button>
            {children}
        </div>
    ),
}));

vi.mock('@/components/GameUI/GameUI', () => ({ default: () => <div data-testid="game-ui" /> }));
vi.mock('@/components/GuessMarker/GuessMarker', () => ({ default: () => <div data-testid="guess-marker" /> }));
vi.mock('@/components/TargetMarker/TargetMarker', () => ({ default: () => <div data-testid="target-marker" /> }));
vi.mock('@/components/Distance/Distance', () => ({ default: () => <div data-testid="distance-line" /> }));
vi.mock('./components/TeamBar', () => ({ default: ({ team }: any) => <div data-testid={`team-bar-${team.name}`}>{team.name}</div> }));

describe('GameContent Component - Integration Tests', () => {
    const mockNavigate = vi.fn();
    const mockSetIsSubmitted = vi.fn();
    const mockSetGuessLocation = vi.fn();
    const mockMap = { fitBounds: vi.fn() };

    let mockRoomListeners: Record<string, Function> = {};
    let mockQueueListeners: Record<string, Function> = {};

    const defaultGameData = {
        teams: [{ name: 'Alpha', players: [] }, { name: 'Beta', players: [] }],
        location: { lat: 40.7128, lng: -74.0060, heading: 90 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockRoomListeners = {};
        mockQueueListeners = {};

        (useNavigate as any).mockReturnValue(mockNavigate);

        (useMultiplayerContext as any).mockReturnValue({
            gameKey: 'lobby-xyz-123',
            isJoined: true,
        });

        (useGameContext as any).mockReturnValue({
            guessLocation: null,
            map: mockMap,
            setGuessLocation: mockSetGuessLocation,
            setIsSubmitted: mockSetIsSubmitted,
        });

        (useQuery as any).mockReturnValue({
            data: defaultGameData,
            isLoading: false,
        });

        (gameRoom.on as any).mockImplementation((event: string, cb: Function) => {
            mockRoomListeners[event] = cb;
        });
        (gameQueue.on as any).mockImplementation((event: string, cb: Function) => {
            mockQueueListeners[event] = cb;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('1. WebSocket Lifecycle (Mount / Unmount)', () => {
        it('should successfully subscribe to all required room and queue events on mount', () => {
            render(<GameContent />);

            expect(gameRoom.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(gameRoom.on).toHaveBeenCalledWith('new_round', expect.any(Function));
            expect(gameRoom.on).toHaveBeenCalledWith('game_end', expect.any(Function));
            expect(gameQueue.on).toHaveBeenCalledWith('new_round', expect.any(Function));
            expect(gameQueue.on).toHaveBeenCalledWith('game_end', expect.any(Function));
        });

        it('should trigger cleanup methods (.off) for all socket listeners upon unmounting', () => {
            const { unmount } = render(<GameContent />);
            unmount();

            expect(gameRoom.off).toHaveBeenCalledWith('message');
            expect(gameRoom.off).toHaveBeenCalledWith('new_round');
            expect(gameRoom.off).toHaveBeenCalledWith('game_end');
            expect(gameQueue.off).toHaveBeenCalledWith('new_round');
            expect(gameQueue.off).toHaveBeenCalledWith('game_end');
        });
    });

    describe('2. API Data Synchronization & Google StreetView', () => {
        it('should render team bars based on data loaded from useQuery', async () => {
            (fetchGame as any).mockResolvedValueOnce(defaultGameData);
            render(<GameContent />);

            const queryOptions = (useQuery as any).mock.calls[0][0];
            await act(async () => {
                await queryOptions.queryFn();
            });

            expect(screen.getByTestId('team-bar-Alpha')).toBeDefined();
            expect(screen.getByTestId('team-bar-Beta')).toBeDefined();
        });

        it('should automatically update StreetView panorama position when queryFn resolves successfully', async () => {
            (fetchGame as any).mockResolvedValueOnce(defaultGameData);
            render(<GameContent />);
            
            const queryOptions = (useQuery as any).mock.calls[0][0];
            
            await act(async () => {
                await queryOptions.queryFn();
            });

            expect(mockSetPov).toHaveBeenCalledWith({ heading: 90, pitch: 5 });
            expect(mockSetPosition).toHaveBeenCalledWith({ lat: 40.7128, lng: -74.0060 });
        });

        it('should disable query fetching if player has not joined the session', () => {
            (useMultiplayerContext as any).mockReturnValue({ gameKey: 'key', isJoined: false });
            render(<GameContent />);
            
            const queryOptions = (useQuery as any).mock.calls[0][0];
            expect(queryOptions.enabled).toBe(false);
        });
    });

    describe('3. User Actions (Guesses / Submissions)', () => {
        it('should display GuessMarker when user selects a point on the map without submitting', () => {
            (useGameContext as any).mockReturnValue({
                guessLocation: { lat: 50.4501, lng: 30.5234 },
                map: mockMap,
                setGuessLocation: mockSetGuessLocation,
                setIsSubmitted: mockSetIsSubmitted,
            });

            render(<GameContent />);
            expect(screen.getByTestId('guess-marker')).toBeDefined();
        });

        it('should call submitGuess with selected coordinates and flag state on submit button click', () => {
            const currentGuess = { lat: 48.3794, lng: 31.1656 };
            (useGameContext as any).mockReturnValue({
                guessLocation: currentGuess,
                map: mockMap,
                setGuessLocation: mockSetGuessLocation,
                setIsSubmitted: mockSetIsSubmitted,
            });

            render(<GameContent />);
            
            const submitBtn = screen.getByTestId('submit-guess-btn');
            fireEvent.click(submitBtn);

            expect(submitGuess).toHaveBeenCalledWith(currentGuess);
            expect(mockSetIsSubmitted).toHaveBeenCalledWith(true);
        });

        it('should not fire submitGuess invocation if no location is selected', () => {
            render(<GameContent />);
            
            const submitBtn = screen.getByTestId('submit-guess-btn');
            fireEvent.click(submitBtn);

            expect(submitGuess).not.toHaveBeenCalled();
            expect(mockSetIsSubmitted).not.toHaveBeenCalled();
        });
    });

    describe('4. Round Adjustments (New Round Flow)', () => {
        const roundUpdatePayload = {
            target: { lat: 20, lng: 20 },
            teams: [
                {
                    name: 'Alpha',
                    players: [{ guess: { lat: 21, lng: 21 } }]
                }
            ]
        };

        it('should adapt map bounds under new target and guess positions upon new_round event from room', async () => {
            render(<GameContent />);

            await act(async () => {
                mockRoomListeners['new_round'](roundUpdatePayload);
            });

            expect(mockMap.fitBounds).toHaveBeenCalled();
            expect(screen.getByTestId('target-marker')).toBeDefined();
            expect(screen.getByTestId('distance-line')).toBeDefined();
            expect(screen.getByText('Result')).toBeDefined();
        });

        it('should respond appropriately to new_round events dispatched via gameQueue', async () => {
            render(<GameContent />);

            await act(async () => {
                mockQueueListeners['new_round'](roundUpdatePayload);
            });

            expect(mockMap.fitBounds).toHaveBeenCalled();
        });

        it('should invalidate react-query cache and clear context state after round cooldown timeout', async () => {
            render(<GameContent />);

            await act(async () => {
                mockRoomListeners['new_round'](roundUpdatePayload);
            });

            await act(async () => {
                vi.advanceTimersByTime(5000); 
            });

            await act(async () => {
                await Promise.resolve();
            });

            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['game', 'lobby-xyz-123'] });
            expect(mockSetGuessLocation).toHaveBeenCalledWith(null);
            expect(mockSetIsSubmitted).toHaveBeenCalledWith(false);
            expect(screen.queryByText('Result')).toBeNull();
        });
    });

    describe('5. Match Finalization (End Game Automation)', () => {
        const endGamePayload = {
            winner: { teamName: 'Alpha Winners' },
            target: { lat: 10, lng: 10 },
            teams: [],
            roundData: {
                target: { lat: 10, lng: 10 },
                teams: []
            }
        };

        it('should remove select-map overlay and mount match completion button when game_end triggers', async () => {
            render(<GameContent />);

            await act(async () => {
                mockRoomListeners['game_end'](endGamePayload);
            });

            expect(screen.queryByTestId('location-select-map')).toBeNull();
            expect(screen.getByRole('button', { name: /finish game!/i })).toBeDefined();
        });

        it('should instantly redirect back to home route upon manual click of finish button', async () => {
            render(<GameContent />);

            await act(async () => {
                mockRoomListeners['game_end'](endGamePayload);
            });

            const finishBtn = screen.getByRole('button', { name: /finish game!/i });
            fireEvent.click(finishBtn);

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });

        it('should trigger automatic route exit back to home after end game cooldown finishes', async () => {
            render(<GameContent />);

            await act(async () => {
                mockQueueListeners['game_end'](endGamePayload);
            });

            expect(mockNavigate).not.toHaveBeenCalled();

            await act(async () => {
                vi.advanceTimersByTime(10000); 
            });

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    describe('6. Error Processing & Server Messages', () => {
        it('should trigger a sonner toast notification when receiving a server message event', () => {
            render(<GameContent />);

            act(() => {
                mockRoomListeners['message']('Inactivity alert!');
            });

            expect(toast.error).toHaveBeenCalledWith('Inactivity alert!');
        });
    });
});