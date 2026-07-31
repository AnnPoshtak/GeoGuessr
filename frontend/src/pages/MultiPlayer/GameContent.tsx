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
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import GameEndScreen from "./components/GameEndScreen";
import { useUser } from "@/context/UserContext.tsx";
import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import { useNavigate } from "react-router-dom";

interface GameState {
    isEnded: boolean;
    winner: string | null;
    teams: Team[];
    roundData: RoundData | null;
    defeatTeamName: string | null;
    currentCooldown: number;
    cooldownMessage: string | null;
    guesses: MapLocation[];
    scores?: Record<number, number>;
}
interface NewRoundData {
    target: MapLocation;
    teams: Team[];
    scores: Record<string, number>;
}
interface RoundData {
    target: MapLocation;
    playerScore: number;
}
interface EndGameData extends NewRoundData {
    winner: string | { teamName: string };
}

const GameContent = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const { gameKey, isJoined } = useMultiplayerContext();

    const setIsPlayerConnected = (playerId: string, value: boolean) => {
        setGameState(prev => ({...prev, teams: prev.teams.map(t =>
        ({
            ...t,
            players: t.players.map((p) => p.firebase_uid === playerId ? {
                ...p,
                is_connected: value,
            } : p)
        })
        )}));
    };


    const [gameState, setGameState] = useState<GameState>({
        isEnded: false,
        winner: null,
        teams: [],
        roundData: null,
        defeatTeamName: null,
        currentCooldown: -1,
        cooldownMessage: null,
        guesses: [],
    });

    const { guessLocation, map, setGuessLocation, isSubmitted, setIsSubmitted } = useGameContext();

    const totalPlayersCount = gameState.teams.reduce((acc, t) => acc + t.players.length, 0);
    const submittedPlayersCount = gameState.teams.reduce((acc, t) => acc + t.players.filter(p => !!p.guess).length, 0);

    const isAllReady = submittedPlayersCount === totalPlayersCount && totalPlayersCount > 0;

    function messageCallback(message: string) {
        toast.error(message);
    }

    async function newRoundCallback(data: NewRoundData) {
        handleNewRound(data);
    }

    function gameEndCallback(data: EndGameData) {
        handleNewRound(data);
        const winnerName = typeof data.winner === 'string' ? data.winner : data.winner?.teamName ?? null;
        setGameState(p => ({ ...p, isEnded: true, winner: winnerName }));
    }
    const { user } = useUser();
    const navigate = useNavigate();

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
            if (data.id === user?.firebase_uid) navigate('/');
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
        };

        const teamSubmittedCallback = (data: {current_cooldown: number, cooldown_message: string}) => {
            setGameState((p) => ({...p, currentCooldown: data.current_cooldown, cooldownMessage: data.cooldown_message}));
        };
        const inactivityKickNotificationCallback = (data: {current_cooldown: number, cooldown_message: string}) => {
            setGameState((p) => ({...p, currentCooldown: data.current_cooldown, cooldownMessage: data.cooldown_message}));
        };
        const inactivityKickCancelledCallback = () => {
            setGameState((p) => ({...p, currentCooldown: -1, cooldownMessage: null}));
        }

        const realTargetCallback = (data: {target: StreetViewLocationFromApi}) => {
            console.log(data.target, viewRef.current);
            if (viewRef.current) {
                viewRef.current.setPov({ heading: data.target.heading, pitch: 5 });
                viewRef.current.setPosition({ lat: data.target.lat, lng: data.target.lng });
            }
        };

        gameRoom.on('record_defeat_started', recordDefeatStartedCallback);
        gameRoom.on('record_defeat_cancelled', recordDefeatCancelledCallback);
        gameRoom.on('team_submitted', teamSubmittedCallback);
        gameRoom.on('inactivity_kick_notification', inactivityKickNotificationCallback);
        gameRoom.on('inactivity_kick_cancelled', inactivityKickCancelledCallback);
        gameRoom.on('real_target', realTargetCallback);

        gameRoom.on('game_end', gameEndCallback);
        gameQueue.on('game_end', gameEndCallback);

        return () => {
            gameRoom.off('new_round', newRoundCallback);
            gameRoom.off('message', messageCallback);
            gameRoom.off('player_reconnected');
            gameRoom.off('player_disconnected');

            gameRoom.off('record_defeat_started', recordDefeatStartedCallback);
            gameRoom.off('record_defeat_cancelled', recordDefeatCancelledCallback);
            gameRoom.off('inactivity_kick_notification', inactivityKickNotificationCallback);
            gameRoom.off('inactivity_kick_cancelled', inactivityKickCancelledCallback);
            gameRoom.off('team_submitted', teamSubmittedCallback);
            gameRoom.off('new_round', newRoundCallback);
            gameRoom.off('game_end', gameEndCallback);
            gameRoom.off('real_target', realTargetCallback);
            gameQueue.off('game_end', gameEndCallback);
        };
    }, [isJoined, gameKey, map]);

    useEffect(() => {
        if (gameState.currentCooldown <= 0) return;
        const interval = setInterval(() => {
            setGameState((p) => ({
                ...p, 
                currentCooldown: p.currentCooldown - 1,
            }));
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [gameState]);

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    const { data: game } = useQuery<GameRoom | null>({
        queryKey: ['game', gameKey],
        queryFn: async () => {
            const data = await fetchGame();
            if (viewRef.current) {
                viewRef.current.setPov({ heading: data.target.heading, pitch: 5 });
                viewRef.current.setPosition({ lat: data.target.lat, lng: data.target.lng });
            }
            setGuessLocation(data.guess);
            setIsSubmitted(!!data.guess);
            setGameState((p) => ({
                ...p, 
                target: data.target, 
                teams: data.teams, 
                currentCooldown: data.current_cooldown,
                cooldownMessage: data.cooldown_message,
                isSubmitted: !!data.guess,
            }))
            return data;
        },
        enabled: isJoined && !gameState.isEnded,
        staleTime: Infinity
    });

    const handleNewRound = (data: NewRoundData) => {
        if (!map) return;
        if (!user) return;
        const bounds = new google.maps.LatLngBounds();
        data.teams.forEach((t) => {
            for (let pl of t.players) {
                const guess = pl.guess;
                if (!guess) continue;
                setGameState(p => ({...p, guesses: [...p.guesses, guess]}));
                bounds.extend(guess);
            }
        });
        setIsSubmitted(true);
        bounds.extend(data.target);
        setGameState((p) => ({
                ...p, 
                teams: data.teams,
                scores: data.scores,
                roundData: {
                    target: data.target, 
                    playerScore: data.scores[user.firebase_uid] ?? 0
                },
                currentCooldown: -1,
                cooldownMessage: null,
            })
        );
        map.fitBounds(bounds);
        setTimeout(async () => {
            await queryClient.invalidateQueries({ queryKey: ['game', gameKey] });
            setGuessLocation(null);
            setIsSubmitted(false);
            setGameState((p) => ({
                    ...p, 
                    roundData: null,
                    guesses: [],
                    isSubmitted: false,
                })
            );
        }, config.roundAutomoveCooldown);
    };

    const submit = () => {
        if (!guessLocation) return;
        submitGuess(guessLocation);
        setIsSubmitted(true);
        setGameState((p) => ({...p}));
    };

    const getStatusColor = () => {
        if (isAllReady) return 'text-emerald-400';
        if (guessLocation) return 'text-amber-400';
        return 'text-neutral-400';
    };

    return (
        <div className="w-full h-full absolute inset-0 bg-[#080f1a] overflow-hidden select-none">
            {isJoined && (
                <div className="absolute top-0 left-0 right-0 z-40 w-full px-3 md:px-4 py-2 border-b border-white/5 bg-neutral-950/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2 w-full">
                        {/* Left Team */}
                        {gameState.teams[0] && (
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-cyan-400 truncate">
                                        {gameState.teams[0].name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="text-xs font-semibold text-rose-400">
                                            {gameState.teams[0].health}/{ config.startingPlayerHealth * gameState.teams[0].players.length}
                                        </div>
                                        <div className="h-1 flex-1 min-w-0 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-500" 
                                                style={{ width: `${Math.max(0, Math.min(100, (gameState.teams[0].health / (config.startingPlayerHealth * gameState.teams[0].players.length)) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                    {gameState.defeatTeamName === gameState.teams[0].name && (
                                        <div className="text-xs font-bold text-red-500 mt-1">
                                            Defeat in {gameState.currentCooldown}s
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Center - Round & Timer */}
                        <div className="flex flex-col items-center gap-1 px-2">
                            <div className="text-xs font-bold text-cyan-300">Round {game?.round}</div>
                            <div className="text-sm font-black text-cyan-300">X{game?.multiplier || 1}</div>
                            {gameState.currentCooldown > 0 && <div>
                                {gameState.cooldownMessage && <p className="text-sm">{gameState.cooldownMessage}</p>}
                                <span className="text-3xl">{gameState.currentCooldown}</span>
                            </div>}
                        </div>

                        {/* Right Team */}
                        {gameState.teams[1] && (
                            <div className="flex items-center gap-2 min-w-0 flex-1 flex-row-reverse">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-cyan-400 truncate text-right">
                                        {gameState.teams[1].name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-row-reverse">
                                        <div className="text-xs font-semibold text-rose-400">
                                            {gameState.teams[1].health}/{config.startingPlayerHealth * gameState.teams[1].players.length}
                                        </div>
                                        <div className="h-1 flex-1 min-w-0 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-500" 
                                                style={{ width: `${Math.max(0, Math.min(100, (gameState.teams[1].health / (config.startingPlayerHealth * gameState.teams[1].players.length)) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                    {gameState.defeatTeamName === gameState.teams[1].name && (
                                        <div className="text-xs font-bold text-red-500 mt-1 text-right">
                                            Defeat in {gameState.currentCooldown}s
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                <GameEndScreen 
                    teams={gameState.teams}
                    game={game}
                    scores={gameState.scores ?? {}}
                    onClose={() => {}}
                />
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
                                {gameState.guesses.map((g, idx) => (
                                    <div key={idx}>
                                        <Distance
                                            path={g && gameState.roundData?.target ? [g, gameState.roundData.target] : []}
                                            visible={!!gameState}
                                        />
                                        <GuessMarker position={g} />
                                    </div>
                                ))}
                                {gameState.roundData?.playerScore !== undefined &&
                                    <div className="absolute rounded-xl bg-[#080f1a]/95 border border-white/15 text-white p-5 bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col items-center w-[calc(100%-1.5rem)] max-w-[260px] sm:min-w-[220px] shadow-2xl backdrop-blur-md z-50 cursor-pointer transition-all duration-300 cubic-bezier(0.25, 0.8, 0.25, 1) hover:scale-[1.1] hover:origin-bottom hover:z-[999] hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase tracking-wider mb-2">
                                            <MapPin size={18} />
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