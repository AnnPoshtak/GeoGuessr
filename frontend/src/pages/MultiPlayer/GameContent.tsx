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
import type { RoundData } from "@/interfaces/RoundData";
import type { ApiTeam, Team } from "@/interfaces/Team";
import fetchGame from "@/ws/fetchGame";
import submitGuess from "@/ws/submitGuess";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { RiPinDistanceFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TeamBar from "./components/TeamBar";

interface GameState {
    isEnded: boolean;
    winner: Record<string, string> | null;
    roundData: RoundData | null;
}

interface EndGameData extends RoundData {
    winner: Record<string, string>;
    roundData: RoundData;
}

const GameContent = () => {
    const [allGuesses, setAllGuesses] = useState<MapLocation[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const { gameKey, isJoined } = useMultiplayerContext();

    const setIsPlayerConnected = (playerId: number, value: boolean) => {
        setTeams(prev => prev.map(t =>
        ({
            ...t,
            players: t.players.map((p) => p.id === playerId ? {
                ...p,
                isConnected: value,
            } : p)
        })
        ));
    };

    const initTeams = (teams: ApiTeam[]) => teams.map((t) => ({
        ...t,
        players: t.players.map(p => ({
            ...p,
            isConnected: true,
        }))
    }))

    const navigate = useNavigate();
    const [gameState, setGameState] = useState<GameState>({
        isEnded: false,
        winner: null,
        roundData: null,
    });

    useEffect(() => {
        if (!gameState.isEnded) return;
        const timeout = setTimeout(leaveGame, config.gameEndAutoMoveCooldown);
        return () => {
            clearTimeout(timeout);
        };
    }, [gameState, navigate]);

    const { guessLocation, map, setGuessLocation, setIsSubmitted } = useGameContext();

    useEffect(() => {
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

        gameRoom.on('game_end', gameEndCallback);
        gameQueue.on('game_end', gameEndCallback);

        return () => {
            gameRoom.off('new_round');
            gameRoom.off('game_end');
            gameRoom.off('message');

            gameRoom.off('player_reconnected');
            gameRoom.off('player_disconnected');

            gameQueue.off('new_round');
            gameQueue.off('game_end');
        };
    }, [isJoined, gameKey, map]);

    const setRoundData = (data: typeof gameState.roundData) => {
        setGameState(p => ({ ...p, roundData: data }));
    };

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    const { data: game } = useQuery<GameRoom | null>({
        queryKey: ['game', gameKey],
        queryFn: async () => {
            console.log('Fetching game...');
            const data = await fetchGame();
            console.log(data);
            setTeams(initTeams(data.teams));
            if (viewRef.current) {
                viewRef.current.setPov({
                    heading: data.location.heading,
                    pitch: 5
                });
                viewRef.current.setPosition({
                    lat: data.location.lat,
                    lng: data.location.lng,
                });
            }
            return data;
        },
        enabled: isJoined && !gameState.isEnded,
        staleTime: Infinity
    });

    const leaveGame = () => {
        navigate('/');
    };

    const handleNewRound = (data: RoundData) => {
        if (!map) return;
        const bounds = new google.maps.LatLngBounds();
        setTeams(initTeams(data.teams));
        data.teams.forEach((t) => {
            for (let pl of t.players) {
                setAllGuesses(p => [...p, pl.guess]);
                bounds.extend(pl.guess);
            }
        });

        bounds.extend(data.target);

        setRoundData(data);
        map.fitBounds(bounds);
        setTimeout(async () => {
            await queryClient.invalidateQueries({
                queryKey: ['game', gameKey],
            });
            setGuessLocation(null);
            setRoundData(null);
            setIsSubmitted(false);
            setAllGuesses([]);
        }, config.roundAutoMoveCooldown);
    };

    const newRoundCallback = async (data: RoundData) => {
        console.log('New Round!');
        handleNewRound(data);
    };

    const gameEndCallback = (data: EndGameData) => {
        handleNewRound(data);
        setGameState(p => ({
            ...p,
            isEnded: true,
            winner: data.winner
        }));
    };

    const messageCallback = (message: string) => {
        toast.error(message);
    };

    const submit = () => {
        if (!guessLocation) return;
        submitGuess(guessLocation);
        setIsSubmitted(true);
    };

    return (
        <div className="w-full h-full absolute inset-0 bg-[#080f1a] overflow-hidden select-none">
            <div className="absolute pointer-events-none z-40 top-0 w-full pt-4 px-4 md:px-6">
                <div className="flex justify-between items-start text-neutral-50 w-full *:pointer-events-auto">
                    {teams.map((t, index) => (
                        <TeamBar key={index} rtl={index % 2 !== 0} team={t} />
                    ))}
                </div>
            </div>

            <StreetView
                apiKey={apiKey}
                zoom={14}
                className="w-full h-full absolute inset-0 z-10"
                panoramaProps={{
                    onLoad(v) {
                        viewRef.current = v;
                        if (!game) return;
                        v.setPov({
                            heading: game.location.heading,
                            pitch: 5,
                        });
                        v.setPosition({
                            lat: game.location.lat,
                            lng: game.location.lng
                        });
                    },
                    options: {
                        zoom: 0.5,
                        motionTracking: false,
                        addressControl: false,
                        fullscreenControl: false,
                    },
                }}
            />

            {gameState.isEnded ? (
                <button
                    className="absolute z-40 bottom-6 right-6 md:right-12 rounded-xl w-[calc(100%-3rem)] sm:w-64 font-black text-sm uppercase tracking-wider py-4 px-6 transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
                    style={{
                        background: 'rgba(239,68,68,0.9)',
                        color: '#fff',
                        boxShadow: '0 8px 32px rgba(239,68,68,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
                    }}
                    onClick={leaveGame}
                >
                    Finish Game!
                </button>
            ) : (
                <LocationSelectMap
                    submitGuess={submit}
                    moveNext={() => { }}
                    isMoveNextBtnEnabled={false}
                    apiKey={apiKey}
                    className="absolute z-30 bottom-6 right-6 p-1.5 w-[90%] h-1/3 sm:w-80 sm:h-56 md:w-96 md:h-64 rounded-2xl border border-white/10 bg-[#0c1524]/80 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out sm:hover:w-[450px] sm:hover:h-[320px]"
                >
                    {gameState.roundData ? (
                        <>
                            <TargetMarker position={gameState.roundData.target} />
                            {allGuesses.map((g, idx) => (
                                <div key={idx}>
                                    <Distance
                                        path={g && gameState.roundData ? [g, gameState.roundData.target] : []}
                                        visible={!!gameState.roundData}
                                    />
                                    <GuessMarker position={g} />
                                </div>
                            ))}
                            <div className="absolute rounded-xl bg-[#080f1a]/95 border border-cyan-500/30 text-white p-3 bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center min-w-[140px] shadow-lg backdrop-blur-sm animate-fade-in z-50">
                                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                                    <RiPinDistanceFill size={18} className="animate-pulse" />
                                    <span>Result</span>
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 font-medium tracking-wide">
                                    Calculated score...
                                </div>
                            </div>
                        </>
                    ) : (
                        guessLocation && <GuessMarker position={guessLocation} />
                    )}
                </LocationSelectMap>
            )}
            <GameUI />
        </div>
    );
};

export default GameContent;