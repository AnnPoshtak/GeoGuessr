import queryClient from "@/api/queryClient";
import Distance from "@/components/Distance/Distance";
import GameUI from "@/components/GameUI/GameUI";
import GuessMarker from "@/components/GuessMarker/GuessMarker";
import LocationSelectMap from "@/components/LocationSelectMap/LocationSelectMap";
import StreetView from "@/components/StreetView/StreetView";
import TargetMarker from "@/components/TargetMarker/TargetMarker";
import config from "@/config";
import { useGameContext } from "@/context/GameContext";
import { useMultiplayerContext } from "@/context/MultiplayerContext";
import type { GameRoom } from "@/interfaces/GameRoom";
import type { MapLocation } from "@/interfaces/MapLocation";
import type { Team } from "@/interfaces/Team";
import fetchGame from "@/ws/fetchGame";
import submitGuess from "@/ws/submitGuess";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { RiPinDistanceFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TeamBar from "./components/TeamBar";
import { useUser } from "@/context/UserContext.tsx";

interface GameState {
    isEnded: boolean;
    winner: Team | null;
    teams: Team[];
    roundData: RoundData | null;
    defeatTeamName: string | null;
}
interface NewRoundData {
    target: MapLocation;
    teams: Team[];
    scores: Record<number, number>;
}
interface RoundData {
    target: MapLocation;
    playerScore: number;
}
interface EndGameData extends NewRoundData {
    winner: Team;
}

const GameContent = () => {
    const [allGuesses, setAllGuesses] = useState<MapLocation[]>([]);
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const { gameKey, isJoined } = useMultiplayerContext();

    const setIsPlayerConnected = (playerId: number, value: boolean) => {
        setGameState(prev => ({...prev, teams: prev.teams.map(t =>
        ({
            ...t,
            players: t.players.map((p) => p.id === playerId ? {
                ...p,
                is_connected: value,
            } : p)
        })
        )}));
    };

    const navigate = useNavigate();
    const [gameState, setGameState] = useState<GameState>({
        isEnded: false,
        winner: null,
        teams: [],
        roundData: null,
        defeatTeamName: null,
    });

    useEffect(() => {
        if (!gameState.isEnded) return;
        const timeout = setTimeout(leaveGame, config.gameEndAutomoveCooldown);
        return () => {
            clearTimeout(timeout);
        };
    }, [gameState, navigate]);

    const { guessLocation, map, setGuessLocation, isSubmitted, setIsSubmitted } = useGameContext();

    const totalPlayersCount = gameState.teams.length;
    const submittedPlayersCount = gameState.teams.filter(t => 
        t.players.some(p => !!p.guess)
    ).length;

    const isAllReady = submittedPlayersCount === totalPlayersCount && totalPlayersCount > 0;

    function messageCallback(message: string) {
        toast.error(message);
    }

    async function newRoundCallback(data: NewRoundData) {
        handleNewRound(data);
    }

    function gameEndCallback(data: EndGameData) {
        handleNewRound(data);
        setGameState(p => ({ ...p, isEnded: true, winner: data.winner }));
    }
    const { user } = useUser();
    
    useEffect(() => {
        if (!isJoined) return;

        gameRoom.on('message', messageCallback);
        gameRoom.on('new_round', newRoundCallback);
        gameQueue.on('new_round', newRoundCallback);

        gameRoom.on('player_reconnected', (data) => {
            setIsPlayerConnected(data.id, true);
            toast.info(`Player ${data.username} has reconnected to the game!`);
        });

        gameRoom.on('player_disconnected', (data) => {
            setIsPlayerConnected(data.id, false);
            toast.info(`Player ${data.username} has disconnected from the game!`);
        });

        const recordDefeatStartedCallback = (data: {team: string}) => {
            setGameState((p) => ({
                ...p,
                defeatTeamName: data.team,
            }));
        };
        const recordDefeatCancelledCallback = () => {
            setGameState((p) => ({
                ...p,
                defeatTeamName: null,
            }));
        }

        gameRoom.on('record_defeat_started', recordDefeatStartedCallback);
        gameRoom.on('record_defeat_cancelled', recordDefeatCancelledCallback);

        gameRoom.on('game_end', gameEndCallback);
        gameQueue.on('game_end', gameEndCallback);

        return () => {
            gameRoom.off('new_round', newRoundCallback);
            gameRoom.off('message', messageCallback);
            gameRoom.off('player_reconnected');
            gameRoom.off('player_disconnected');

            gameRoom.off('record_defeat_started', recordDefeatStartedCallback);
            gameRoom.off('record_defeat_cancelled', recordDefeatCancelledCallback);
            gameRoom.off('new_round', newRoundCallback);
            gameRoom.off('game_end', gameEndCallback);
            gameQueue.off('game_end', gameEndCallback);
        };
    }, [isJoined, gameKey, map]);

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    const { data: game } = useQuery<GameRoom | null>({
        queryKey: ['game', gameKey],
        queryFn: async () => {
            const data = await fetchGame();
            if (viewRef.current) {
                viewRef.current.setPov({ heading: data.target.heading, pitch: 5 });
                viewRef.current.setPosition({ lat: data.target.lat, lng: data.target.lng });
            }
            setGameState((p) => ({...p, target: data.target, teams: data.teams}))
            return data;
        },
        enabled: isJoined && !gameState.isEnded,
        staleTime: Infinity
    });

    const leaveGame = () => {
        navigate('/');
    };

    const handleNewRound = (data: NewRoundData) => {
        if (!map) return;
        if (!user) return;
        const bounds = new google.maps.LatLngBounds();
        data.teams.forEach((t) => {
            for (let pl of t.players) {
                const guess = pl.guess;
                if (!guess) continue;
                setAllGuesses(p => [...p, guess]);
                bounds.extend(guess);
            }
        });
        bounds.extend(data.target);
        setGameState((p) => ({
                ...p, 
                teams: data.teams,
                roundData: {
                    target: data.target, 
                    playerScore: data.scores[user.id]
                },
            })
        );
        map.fitBounds(bounds);
        setTimeout(async () => {
            await queryClient.invalidateQueries({ queryKey: ['game', gameKey] });
            setGuessLocation(null);
            setGameState((p) => ({
                    ...p, 
                    roundData: null,
                })
            );
            setIsSubmitted(false);
            setAllGuesses([]);
        }, config.roundAutomoveCooldown);
    };

    const submit = () => {
        if (!guessLocation || isSubmitted) return;
        submitGuess(guessLocation);
        setIsSubmitted(true);
    };

    const getStatusColor = () => {
        if (isAllReady) return 'text-emerald-400';
        if (isSubmitted) return 'text-amber-400';
        return 'text-neutral-400';
    };

    return (
        <div className="relative min-h-dvh w-full bg-[#080f1a] overflow-x-hidden select-none">
            <div className="absolute pointer-events-none z-40 top-0 w-full pt-4 px-3 sm:px-4 md:px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(92vw,12rem)] h-20 bg-neutral-800/80 text-white text-center rounded-b-[50%_100%] shadow-lg">
                    <p>Round:</p>
                    <h2 className="text-2xl">{game?.round || 1}</h2>
                    <p>x{game?.multiplier || 1}</p>
                </div>
                {isJoined && (
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start text-neutral-50 w-full *:pointer-events-auto">
                        {gameState.teams.map((t, index) => (
                            <TeamBar key={index} rtl={index % 2 !== 0} team={t} defeatTeamName={gameState.defeatTeamName} />
                        ))}
                    </div>
                )}
            </div>

            <StreetView
                apiKey={apiKey}
                zoom={14}
                className="w-full h-full absolute inset-0 z-10"
                panoramaProps={{
                    onLoad(v) {
                        viewRef.current = v;
                        if (!game) return;
                        v.setPov({ heading: game.target.heading, pitch: 5 });
                        v.setPosition({ lat: game.target.lat, lng: game.target.lng });
                    },
                    options: { zoom: 0.5, motionTracking: false, addressControl: false, fullscreenControl: false }
                }}
            />

            {gameState.isEnded ? (
                <button
                    className="absolute z-40 left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 rounded-xl w-auto sm:w-64 font-black text-sm uppercase tracking-wider py-4 px-6 transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
                    style={{
                        background: 'rgba(239,68,68,0.9)',
                        color: '#fff',
                        boxShadow: '0 8px 32px rgba(239,68,68,0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
                    }}
                    onClick={leaveGame}
                >
                    Finish Game!
                </button>
            ) : (
                <div className={`absolute z-30 left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 p-1.5 rounded-2xl border border-white/10 bg-[#0c1524]/80 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out 
                    ${isJoined 
                        ? "left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 w-auto h-[34vh] min-h-[220px] sm:w-80 sm:h-64 md:w-96 md:h-72 sm:hover:w-[450px] sm:hover:h-[360px] flex flex-col justify-between" 
                        : "left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 w-auto h-[34vh] min-h-[220px] sm:w-80 sm:h-56 md:w-96 md:h-64 sm:hover:w-[450px] sm:hover:h-[320px]"
                    }`}
                >
                    <LocationSelectMap
                        submitGuess={submit}
                        moveNext={() => {}}
                        isMoveNextBtnEnabled={true}
                        isMultiplayer={isJoined}
                        apiKey={apiKey}
                        className={isJoined ? "w-full h-[75%] rounded-xl overflow-hidden" : "w-full h-full"}
                    >
                        {gameState.roundData?.target ? (
                            <>
                                <TargetMarker position={gameState.roundData.target} />
                                {allGuesses.map((g, idx) => (
                                    <div key={idx}>
                                        <Distance
                                            path={g && gameState.roundData?.target ? [g, gameState.roundData.target] : []}
                                            visible={!!gameState}
                                        />
                                        <GuessMarker position={g} />
                                    </div>
                                ))}
                                {gameState.roundData?.playerScore &&
                                    <div className="absolute rounded-xl bg-[#080f1a]/95 border border-white/15 text-white p-5 bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col items-center w-[calc(100%-1.5rem)] max-w-[260px] sm:min-w-[220px] shadow-2xl backdrop-blur-md z-50 cursor-pointer transition-all duration-300 cubic-bezier(0.25, 0.8, 0.25, 1) hover:scale-[1.1] hover:origin-bottom hover:z-[999] hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wider mb-2">
                                            <RiPinDistanceFill size={20} />
                                            <span>Round Results</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 text-center w-full text-xs font-semibold">
                                            <div className="flex flex-col w-full border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                                <div className="flex justify-between w-full px-1 gap-4 items-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={"text-emerald-400"}>
                                                            Your Score: {gameState.roundData?.playerScore}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </>
                        ) : (
                            guessLocation && <GuessMarker position={guessLocation} />
                        )}
                    </LocationSelectMap>

                    {isJoined && (
                        <div className="w-full pt-2 px-1 flex flex-col gap-1 z-40">
                            <button
                                onClick={submit}
                                disabled={!guessLocation || isSubmitted}
                                className="w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium p-2.5 text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer disabled:bg-neutral-900/80 disabled:text-neutral-500 disabled:cursor-not-allowed border border-white/5"
                            >
                                {isSubmitted ? 'Guess Submitted!' : 'Submit Guess!'}
                            </button>
                            
                            <div className="flex justify-between items-center text-[11px] px-1 text-neutral-400 font-medium h-4">
                                <span>Status:</span>
                                <span className={`font-semibold transition-all duration-300 ${getStatusColor()}`}>
                                    {isAllReady 
                                        ? 'All players ready!' 
                                        : isSubmitted 
                                            ? 'Waiting for other players...' 
                                            : 'Waiting for your guess'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <GameUI />
        </div>
    );
};

export default GameContent;