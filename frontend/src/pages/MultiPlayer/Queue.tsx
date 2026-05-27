import { useMultiplayerContext } from "@/context/MultiplayerContext";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useEffect, useState, type MouseEventHandler } from "react";
import { toast } from "sonner";

interface QueueProps {
    players: number[];
    join: MouseEventHandler<HTMLButtonElement>;
    leave: MouseEventHandler<HTMLButtonElement>;
}

const Queue = ({ join, leave }: QueueProps) => {
    const [players, setPlayers] = useState<number[]>([]);
    const [inQueue, setInQueue] = useState(false);
    const { setGameKey } = useMultiplayerContext();

    const messageCallback = (message: string) => {
        toast.error(message);
    }; 

    useEffect(() => {
        gameQueue.on('message', messageCallback);
        gameQueue.on('queue_joined', (data) => {
            console.log('Joined queue');
            setPlayers(JSON.parse(data['queue']));
            setInQueue(true);
        });
        gameQueue.on('queue_left', (data) => {
            console.log('Left queue');
            setPlayers(JSON.parse(data['queue']));
            setInQueue(false);
        });

        gameQueue.on('game_started', (data) => {
            setGameKey(data.game_key);
            setPlayers([]);
            gameRoom.emit('join', {
                'game_key': data.game_key
            });
        });

        return () => {
            gameQueue.off('queue_joined');  
            gameQueue.off('queue_left');
            gameQueue.off('game_started');
            gameQueue.off('message', messageCallback);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[250px] w-full text-center">
            
            {!inQueue ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold tracking-wider text-white uppercase">
                            Ready to explore?
                        </h2>
                        <p className="text-xs text-gray-400 max-w-xs px-4">
                            Join the matchmaking system to test your geographical skills against other players worldwide.
                        </p>
                    </div>

                    <button 
                        onClick={join}
                        className="w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                            background: '#eef2f8',
                            color: '#0d47a1',
                            boxShadow: '0 8px 24px rgba(79,195,247,0.25), 0 4px 10px rgba(0,0,0,0.3)',
                        }}
                    >
                        Find Match
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
                    <div className="relative flex items-center justify-center w-16 h-16">
                        <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                        <div 
                            className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"
                            style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }}
                        />
                        <span className="text-xs font-black text-cyan-400 tracking-tighter">
                            {players.length}/2
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-sm font-bold tracking-[0.15em] text-white uppercase animate-pulse">
                            Searching for players
                        </h2>
                        <p className="text-[11px] text-gray-400 tracking-wider">
                            {players.length === 1 
                                ? "Waiting for an opponent to connect..." 
                                : `There are ${players.length} players in the lobby...`}
                        </p>
                    </div>

                    <button 
                        onClick={leave}
                        className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-[0.12em] transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.25)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}
                    >
                        Leave Queue
                    </button>
                </div>
            )}
        </div>
    );
};
 
export default Queue;