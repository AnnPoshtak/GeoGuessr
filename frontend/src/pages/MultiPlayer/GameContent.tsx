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
import type { Team } from "@/interfaces/Team";
import fetchGame from "@/ws/fetchGame";
import submitGuess from "@/ws/submitGuess";
import { gameQueue, gameRoom } from "@/ws/wsClient";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { RiPinDistanceFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GameState {
    isEnded: boolean;
    winner: Record<string, string> | null;
    roundData: RoundData | null;
};

interface EndGameData extends RoundData {
    winner: Record<string, string>;
    roundData: RoundData;
};

const GameContent = () => {
    const [allGuesses, setAllGuesses] = useState<MapLocation[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const {gameKey, isJoined} = useMultiplayerContext();

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
        }
    }, [gameState, navigate]);

    const { guessLocation, map, setGuessLocation, setIsSubmitted } = useGameContext();

    useEffect(() => {
        gameRoom.on('message', messageCallback);
        gameQueue.on('message', messageCallback);
        gameRoom.on('new_round', newRoundCallback);
        gameQueue.on('new_round', newRoundCallback);

        gameRoom.on('game_end', gameEndCallback);
        gameQueue.on('game_end', gameEndCallback);
        
        return () => { 
            gameRoom.off('new_round');
            gameRoom.off('game_end');
            gameRoom.off('message');
            
            gameQueue.off('new_round');
            gameQueue.off('game_end');
        }
    }, [isJoined, gameKey, map]);

    const setRoundData = (data: typeof gameState.roundData) => {
        setGameState(p => {
            return {
                ...p,
                roundData: data
            }
        }
    )};

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    const { data: game } = useQuery<GameRoom | null>({
        queryKey: ['game', gameKey],
        queryFn: async () => {
            console.log('Fetching game...');
            const data = await fetchGame();
            setTeams(data.teams);
            if (viewRef.current) {
                viewRef.current.setPov({
                    heading: data.location.heading,
                    pitch: 5
                });
                viewRef.current.setPosition({
                    lat: data.location.lat,
                    lng: data.location.lng,
                });
            };
            return data;
        },
        enabled: isJoined && !gameState.isEnded,
        staleTime: Infinity
    });
    const leaveGame = () => {
        navigate('/');
    }
    const handleNewRound = (data: RoundData) => {
        if (!map) return;
        const bounds = new google.maps.LatLngBounds();
        setTeams(data.teams);
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
        }
    const gameEndCallback = (data: EndGameData) => {
        handleNewRound(data);
        setGameState(p => {
            return {
                ...p,
                isEnded: true,
                winner: data.winner
            }
        });
    }
    const messageCallback = (message: string) => {
        toast.error(message);
    };        

    const submit = () => {
        if (!guessLocation) return;
        submitGuess(guessLocation);
        setIsSubmitted(true);
    };

    return <div>
                <div className="absolute pointer-events-none z-40 top-0 h-1/12 w-full">
                    <div className="relative justify-between text-neutral-50 flex w-full h-full *:pointer-events-auto">
                        {teams.map((t) => <div className='text-3xl bg-neutral-600/50 p-2'>
                            {t.health}
                        </div>)}
                    </div>
                </div>
                <StreetView
                    apiKey={apiKey}
                    zoom={14}
                    className="w-full h-full absolute z-10 top-0 right-0"
                    panoramaProps={{
                        onLoad(v) {
                            viewRef.current = v;
                            if (!game) return;
                            v.setPov({
                                heading: game.location.heading,
                                pitch: 5,
                            });
                            v.setPosition({
                                lat: game.location.lat, lng: game.location.lng
                            });
                        },
                        options:
                        {
                            zoom: 0.5,
                            motionTracking: false,
                            addressControl: false,
                            fullscreenControl: false,
                        },
                    }}
                />
                
                {gameState.isEnded ? <button className="absolute z-20 sm:bottom-10 sm:right-16 rounded sm:w-1/2 md:w-1/4 bg-red-500 hover:bg-red-600 cursor-pointer p-2 text-neutral-50"
                onClick={leaveGame}>Next!</button>: 
                <LocationSelectMap submitGuess={submit} moveNext={() => { }} apiKey={apiKey} className="bottom-5 p-2 w-full h-1/3 sm:w-1/2 md:w-1/4 sm:h-1/4 transition-all hover:w-2/5 
            hover:h-2/5 absolute z-20 sm:bottom-10 sm:right-16 flex flex-col gap-1">
                    {gameState.roundData ? <>
                        <TargetMarker position={gameState.roundData.target} />
                        {allGuesses.map(g => <div key={g.lat + g.lng}>
                            <Distance path={g && gameState.roundData ? [
                                g,
                                gameState.roundData.target
                            ] : []} visible={!!gameState.roundData} />

                            <GuessMarker position={g} />
                            {gameState.roundData &&
                                <div className="absolute rounded bg-neutral-800/70 text-neutral-50
                                p-2 bottom-2 left-1/2 -translate-x-1/2">
                                    <div className="flex items-center gap-1"><RiPinDistanceFill size={24} /><span>x km</span></div>
                                    <div>x points</div>
                                </div>
                            }
                        </div>)
                        }

                    </> : guessLocation && <GuessMarker position={guessLocation} />
                    }
                </LocationSelectMap>
                }
                
                <GameUI />
            </div>
}
 
export default GameContent;