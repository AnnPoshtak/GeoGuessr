import { useEffect, useRef, useState } from 'react';
import { gameQueue, gameRoom } from '@/ws/wsClient';
import GameUI from '@/components/GameUI/GameUI';
import LocationSelectMap from '@/components/LocationSelectMap/LocationSelectMap';
import StreetView from '@/components/StreetView/StreetView';
import { useQuery } from '@tanstack/react-query';
import { useGameContext } from '@/context/GameContext';
import queryClient from '@/api/queryClient';
import type { GameRoom } from '@/interfaces/GameRoom';
import submitGuess from '@/ws/submitGuess';
import fetchGame from '@/ws/fetchGame';
import Distance from '@/components/Distance/Distance';
import GuessMarker from '@/components/GuessMarker/GuessMarker';
import type { RoundData } from '@/interfaces/RoundData';
import { RiPinDistanceFill } from 'react-icons/ri';
import TargetMarker from '@/components/TargetMarker/TargetMarker';
import { type MapLocation } from '@/interfaces/MapLocation';

function Multiplayer() {
    const [players, setPlayers] = useState([]);
    const [gameKey, setGameKey] = useState<string | null>(null);
    const [isJoined, setIsJoined] = useState<boolean>(false);
    const [roundData, setRoundData] = useState<RoundData | null>(null);
    const [allGuesses, setAllGuesses] = useState<MapLocation[]>([]);

    const { guessLocation, map, setGuessLocation, setIsSubmitted } = useGameContext();

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    const { data: game } = useQuery<GameRoom | null>({
        queryKey: ['game', gameKey],
        queryFn: async () => {
            console.log('Fetching')
            console.log('Fetching game...');
            const data = await fetchGame();
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
        enabled: isJoined,
        staleTime: Infinity
    });

    useEffect(() => {
        if (!isJoined || !gameKey) return;
        gameRoom.on('new_round', async (data: RoundData) => {
            console.log('New Round!');
            if (!map) return;
            const bounds = new google.maps.LatLngBounds();
            for (let g of Object.values(data.player_data)) {
                setAllGuesses(p => [...p, g.guess]);
                bounds.extend(g.guess);
            }
            bounds.extend(data.target);

            setRoundData(data);
            map.fitBounds(bounds);
            setTimeout(async () => {
                await queryClient.invalidateQueries({
                    queryKey: ['game', gameKey],
                });
                setGuessLocation(null);
                setRoundData(null);
                setAllGuesses([]);
            }, 6000);

        });

        return () => {
            gameRoom.off('new_round');
        }
    }, [isJoined, gameKey, map]);

    useEffect(() => {
        gameQueue.on('queue_joined', (data) => {
            console.log('Joined queue');
            setPlayers(JSON.parse(data['queue']));
        });
        gameQueue.on('game_started', (data) => {
            setGameKey(data.game_key);
            setPlayers([]);
            gameRoom.emit('join', {
                'game_key': data.game_key
            })
        });

        gameQueue.on('queue_left', (data) => {
            console.log('Left queue');
            setPlayers(JSON.parse(data['queue']));
        });

        gameRoom.on('game_joined', () => {
            setIsJoined(true);
        });

        return () => {
            gameQueue.off('queue_joined');
            gameQueue.off('queue_left');
            gameQueue.off('game_started');
            gameQueue.off('game_joined');
        };
    }, []);

    const join = () => {
        gameQueue.emit('join', {
            player_count: 2
        });
    };

    const leave = () => {
        gameQueue.emit('leave');
    };

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;


    const submit = () => {
        if (!guessLocation) return;
        submitGuess(guessLocation);
        setIsSubmitted(true);
    };

    return <>
        {game ? <>
            <div>
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
                <LocationSelectMap submitGuess={submit} moveNext={() => { }} apiKey={apiKey} className="bottom-5 p-2 w-full h-1/3 sm:w-1/2 md:w-1/4 sm:h-1/4 transition-all hover:w-2/5 
            hover:h-2/5 absolute z-20 sm:bottom-10 sm:right-16 flex flex-col gap-1">
                    {roundData ? <>
                        <TargetMarker position={roundData.target} />
                        {allGuesses.map(g => <div key={g.lat + g.lng}>
                            <Distance path={g ? [
                                g,
                                roundData.target
                            ] : []} visible={!!roundData} />

                            <GuessMarker position={g} />
                            {roundData &&
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
                <GameUI />
            </div>
        </> : <div>
            <div>This is multiplayer page</div>
            <div>{players}</div>
            <button className='bg-green-600 rounded p-2' onClick={join}>Join!</button>
            <button className='bg-red-600 rounded p-2' onClick={leave}>Leave!</button>
        </div>}
    </>;
}

export default Multiplayer;