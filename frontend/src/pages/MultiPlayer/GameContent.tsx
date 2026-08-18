import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import queryClient from '@/api/queryClient';
import fetchGame from '@/ws/fetchGame';
import submitGuess from '@/ws/submitGuess';
import { useMultiplayerContext } from '@/context/MultiplayerContext';
import { useUser } from '@/context/UserContext';
import { useGameContext } from '@/context/GameContext';
import { useGameEvents } from '@/hooks/useGameEvents';
import config from '@/config';
import type { GameRoom } from '@/interfaces/GameRoom';
import type { MapLocation } from '@/interfaces/MapLocation';
import type { Team } from '@/interfaces/Team';
import { MultiplayerScorebar } from '@/components/MultiplayerScorebar/MultiplayerScorebar';
import StreetView from '@/components/StreetView/StreetView';
import GameEndScreen from '@/pages/MultiPlayer/components/GameEndScreen';
import LocationSelectMap from '@/components/LocationSelectMap/LocationSelectMap';
import TargetMarker from '@/components/TargetMarker/TargetMarker';
import Distance from '@/components/Distance/Distance';
import GuessMarker from '@/components/GuessMarker/GuessMarker';
import { MultiplayerControls } from '@/components/MultiplayerControls/MultiplayerControls';
import { Trophy } from 'lucide-react';

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
    autosubmitSeconds?: number;
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
    winner: string | { teamName: string };
}

const GameContent = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const { gameKey, isJoined } = useMultiplayerContext();
    const { user } = useUser();
    const { guessLocation, map, setGuessLocation, isSubmitted, setIsSubmitted } = useGameContext();
    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    const [gameState, setGameState] = useState<GameState>({
        isEnded: false,
        winner: null,
        teams: [],
        roundData: null,
        defeatTeamName: null,
        currentCooldown: -1,
        cooldownMessage: null,
        guesses: [],
        autosubmitSeconds: -1,
    });

    const totalPlayersCount = gameState.teams.reduce((acc, t) => acc + t.players.length, 0);
    const submittedPlayersCount = gameState.teams.reduce((acc, t) => acc + t.players.filter(p => !!p.guess).length, 0);
    const isAllReady = submittedPlayersCount === totalPlayersCount && totalPlayersCount > 0;

    const setIsPlayerConnected = (playerId: number, value: boolean) => {
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => ({
                ...t,
                players: t.players.map((p) => p.id === playerId ? { ...p, is_connected: value } : p)
            }))
        }));
    };

    const handleNewRound = (data: NewRoundData) => {
        if (!map || !user) return;
        const bounds = new google.maps.LatLngBounds();
        data.teams.forEach((t) => {
            for (let pl of t.players) {
                if (pl.guess) {
                    setGameState(p => ({ ...p, guesses: [...p.guesses, pl.guess!] }));
                    bounds.extend(pl.guess);
                }
            }
        });
        setIsSubmitted(true);
        bounds.extend(data.target);
        setGameState(p => ({
            ...p,
            teams: data.teams,
            scores: data.scores,
            roundData: { target: data.target, playerScore: data.scores[user.id] ?? 0 },
            autosubmitSeconds: -1,
        }));
        map.fitBounds(bounds);

        setTimeout(async () => {
            await queryClient.invalidateQueries({ queryKey: ['game', gameKey] });
            setGuessLocation(null);
            setIsSubmitted(false);
            setGameState(p => ({ ...p, roundData: null, guesses: [] }));
        }, config.roundAutomoveCooldown);
    };

    const handleGameEnd = (data: EndGameData) => {
        handleNewRound(data);
        const winnerName = typeof data.winner === 'string' ? data.winner : data.winner?.teamName ?? null;
        setGameState(p => ({ ...p, isEnded: true, winner: winnerName }));
    };

    useGameEvents({
        isJoined,
        gameKey,
        map,
        viewRef,
        onNewRound: handleNewRound,
        onGameEnd: handleGameEnd,
        setGameState,
        setIsPlayerConnected,
    });

    // Autosubmit timer effect
    useEffect(() => {
        if (!gameState.autosubmitSeconds || gameState.autosubmitSeconds <= 0) return;
        const interval = setInterval(() => {
            setGameState((p) => ({ ...p, autosubmitSeconds: (p.autosubmitSeconds ?? 0) - 1 }));
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.autosubmitSeconds]);

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
                autosubmitSeconds: data.autosubmit_seconds,
                isSubmitted: !!data.guess,
            }));
            return data;
        },
        enabled: isJoined && !gameState.isEnded,
        staleTime: Infinity
    });

    const submit = () => {
        if (!guessLocation) return;
        submitGuess(guessLocation);
        setIsSubmitted(true);
    };

    return (
        <div className="w-full h-full absolute inset-0 bg-game-bg overflow-hidden select-none font-sans">
            {isJoined && (
                <MultiplayerScorebar
                    teams={gameState.teams}
                    game={game}
                    defeatTeamName={gameState.defeatTeamName}
                    autosubmitSeconds={gameState.autosubmitSeconds}
                    currentUserId={user?.id}
                />
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
                    onClose={() => { }}
                />
            ) : (
                <div className={`absolute z-30 left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 p-2 rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-md shadow-2xl transition-all duration-300 ease-out 
                    ${isJoined
                        ? "w-auto h-[34vh] min-h-[240px] sm:w-80 sm:h-64 md:w-96 md:h-72 sm:hover:w-[450px] sm:hover:h-[360px] flex flex-col justify-between"
                        : "w-auto h-[34vh] min-h-[240px] sm:w-80 sm:h-56 md:w-96 md:h-64 sm:hover:w-[450px] sm:hover:h-[320px]"
                    }`}
                >
                    <LocationSelectMap
                        submitGuess={submit}
                        moveNext={() => { }}
                        isMoveNextBtnEnabled={true}
                        isMultiplayer={isJoined}
                        apiKey={apiKey}
                        className={isJoined ? "w-full h-[75%] rounded-2xl overflow-hidden shadow-inner" : "w-full h-full rounded-2xl overflow-hidden shadow-inner"}
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
                                {gameState.roundData?.playerScore !== undefined && (
                                    <div className="absolute rounded-2xl bg-glass-bg border border-glass-border text-dark p-4 bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col items-center w-[calc(100%-1.5rem)] max-w-[260px] sm:min-w-[220px] shadow-2xl backdrop-blur-md z-50 transition-all duration-300 hover:scale-105">
                                        <div className="flex items-center gap-2 text-accent font-black text-xs uppercase tracking-wider mb-1">
                                            <Trophy size={16} />
                                            <span>Round Results</span>
                                        </div>
                                        <div className="text-sm font-extrabold text-stat-correct">
                                            Your Score: {gameState.roundData?.playerScore}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            guessLocation && <GuessMarker position={guessLocation} />
                        )}
                    </LocationSelectMap>

                    {isJoined && (
                        <MultiplayerControls
                            submit={submit}
                            guessLocation={guessLocation}
                            isSubmitted={isSubmitted}
                            isAllReady={isAllReady}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default GameContent;