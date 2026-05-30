import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Multiplayer from '../pages/MultiPlayer/MultiPlayer';
import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import { useNavigate } from 'react-router-dom';

vi.mock('@/context/MultiplayerContext', () => ({
    useMultiplayerContext: vi.fn()
}));

vi.mock('@/ws/wsClient', () => ({
    gameQueue: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    },
    gameRoom: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
    }
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn()
}));

vi.mock('@/pages/MultiPlayer/Queue', () => ({
    default: ({ join, leave }: { join: () => void; leave: () => void }) => (
        <div data-testid="queue-component">
            <button data-testid="btn-join" onClick={join}>Join</button>
            <button data-testid="btn-leave" onClick={leave}>Leave</button>
        </div>
    )
}));

vi.mock('@/pages/MultiPlayer/GameContent', () => ({
    default: () => <div data-testid="game-content-component">Game Content Loaded</div>
}));

describe('Multiplayer Component', () => {
    const mockSetIsJoined = vi.fn();
    const mockSetGameKey = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        (useNavigate as any).mockReturnValue(mockNavigate);
        
        (useMultiplayerContext as any).mockReturnValue({
            isJoined: false,
            setIsJoined: mockSetIsJoined,
            setGameKey: mockSetGameKey
        });
    });

    it('should render the multiplayer lobby screen when isJoined is false', () => {
        render(<Multiplayer />);
        
        expect(screen.getByRole('heading', { name: /multiplayer/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /back/i })).toBeDefined();
        expect(screen.getByTestId('queue-component')).toBeDefined();
        expect(screen.queryByTestId('game-content-component')).toBeNull();
    });

    it('should render GameContent and not the lobby when isJoined is true', () => {
        (useMultiplayerContext as any).mockReturnValue({
            isJoined: true,
            setIsJoined: mockSetIsJoined,
            setGameKey: mockSetGameKey
        });

        render(<Multiplayer />);

        expect(screen.getByTestId('game-content-component')).toBeDefined();
        expect(screen.queryByRole('heading', { name: /multiplayer/i })).toBeNull();
        expect(screen.queryByTestId('queue-component')).toBeNull();
    });

    it('should call gameQueue emit with correct payload when joinQueue is triggered', () => {
        render(<Multiplayer />);
        
        const joinButton = screen.getByTestId('btn-join');
        fireEvent.click(joinButton);

        expect(gameQueue.emit).toHaveBeenCalledWith('join', { player_count: 2 });
    });

    it('should handle leaveQueue properly when back button is clicked', () => {
        render(<Multiplayer />);
        
        const backButton = screen.getByRole('button', { name: /back/i });
        fireEvent.click(backButton);

        expect(gameQueue.emit).toHaveBeenCalledWith('leave');
        expect(mockSetIsJoined).toHaveBeenCalledWith(false);
        expect(mockSetGameKey).toHaveBeenCalledWith(null);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle leaveQueue when triggered from the Queue component', () => {
        render(<Multiplayer />);
        
        const leaveButton = screen.getByTestId('btn-leave');
        fireEvent.click(leaveButton);

        expect(gameQueue.emit).toHaveBeenCalledWith('leave');
        expect(mockSetIsJoined).toHaveBeenCalledWith(false);
        expect(mockSetGameKey).toHaveBeenCalledWith(null);
    });

    it('should setup socket event listeners on mount', () => {
        render(<Multiplayer />);

        expect(gameQueue.on).toHaveBeenCalledWith('game_joined', expect.any(Function));
        expect(gameRoom.on).toHaveBeenCalledWith('game_joined', expect.any(Function));
    });

    it('should trigger handleJoinGame when gameQueue receives game_joined event', () => {
        render(<Multiplayer />);

        const callback = (gameQueue.on as any).mock.calls.find((call: any) => call[0] === 'game_joined')[1];
        callback();

        expect(mockSetIsJoined).toHaveBeenCalledWith(true);
    });

    it('should trigger handleJoinGame when gameRoom receives game_joined event', () => {
        render(<Multiplayer />);

        const callback = (gameRoom.on as any).mock.calls.find((call: any) => call[0] === 'game_joined')[1];
        callback();

        expect(mockSetIsJoined).toHaveBeenCalledWith(true);
    });
});