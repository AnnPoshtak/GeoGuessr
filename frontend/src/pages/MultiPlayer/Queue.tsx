import queryClient from "@/api/queryClient";
import { useMultiplayerContext } from "@/context/MultiplayerContext";
import type { GameQueue } from "@/interfaces/GameQueue";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useEffect, type MouseEventHandler } from "react";
import { toast } from "sonner";
import { Loader2, Swords, LogOut } from "lucide-react";

interface QueueProps {
    queue: GameQueue | null | undefined;
    join: MouseEventHandler<HTMLButtonElement>;
    leave: MouseEventHandler<HTMLButtonElement>;
}

const Queue = ({ queue, join, leave }: QueueProps) => {
    const { setGameKey } = useMultiplayerContext();

    const messageCallback = (message: string) => {
        toast.error(message);
    }; 

    useEffect(() => {
        gameQueue.on('message', messageCallback);
        gameQueue.on('queue_joined', async () => {
            console.log('Joined queue');
            await queryClient.invalidateQueries({ queryKey: ['queue'] });
        });
        gameQueue.on('queue_left', async (data) => {
            console.log('Left queue');
            queryClient.setQueryData<GameQueue | null>(['queue'], (old) => {
                if (!old) return null;
                return { ...old, players: data.queue };
            });
        });

        gameQueue.on('game_started', (data) => {
            setGameKey(data.game_key);
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
        <div className="flex flex-col items-center justify-center min-h-[260px] w-full text-center selection:bg-primary/30 font-sans">
            {!queue ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
                    <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-accent flex items-center justify-center mx-auto mb-2">
                            <Swords className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-dark uppercase">
                            Ready to battle?
                        </h2>
                        <p className="text-xs text-muted font-bold max-w-xs px-2 leading-relaxed">
                            Join matchmaking to find opponents and prove your geography knowledge.
                        </p>
                    </div>

                    <button 
                        onClick={join}
                        className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest transition-all duration-300 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        Find Match
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
                    <div className="relative flex items-center justify-center w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                        <Loader2 className="w-20 h-20 text-accent animate-spin stroke-[2.5]" />
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-xs font-black text-dark tracking-tighter">
                                {queue.players.length}/{queue.player_count}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-sm font-black tracking-widest text-dark uppercase animate-pulse">
                            Searching for opponents...
                        </h2>
                        <p className="text-xs text-muted font-bold tracking-wide">
                            Waiting for <span className="text-accent">{queue.player_count - queue.players.length}</span> more player(s)
                        </p>
                    </div>

                    <button 
                        onClick={leave}
                        className="group w-full py-3.5 px-6 rounded-2xl bg-stat-missed/10 border border-stat-missed/20 text-stat-missed font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-stat-missed hover:text-white hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Leave Queue</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Queue;