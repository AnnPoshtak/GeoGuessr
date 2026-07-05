import { gameApi } from "@/api";
import queryClient from "@/api/queryClient";
import Distance from "@/components/Distance/Distance";
import GameUI from "@/components/GameUI/GameUI.tsx";
import GuessMarker from "@/components/GuessMarker/GuessMarker";
import LocationSelectMap from "@/components/LocationSelectMap/LocationSelectMap";
import StreetView from "@/components/StreetView/StreetView.tsx";
import TargetMarker from "@/components/TargetMarker/TargetMarker";
import { useGameContext } from "@/context/GameContext";
import type { MapLocation } from "@/interfaces/MapLocation";
import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { RiPinDistanceFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const navigate = useNavigate();
    const [isEnded, setIsEnded] = useState(false);

    const { data: location, isPending, isError } = useQuery<StreetViewLocationFromApi>({
        queryKey: ['randomLocation'],
        queryFn: async () => {
            const data = await gameApi.getRandomLocation();
            if (viewRef.current) {
                viewRef.current.setPov({
                    heading: data.heading,
                    pitch: 5
                });
                viewRef.current.setPosition({
                    lat: data.lat,
                    lng: data.lng,
                });
            }
            return data;
        },
        retry: false,
        refetchOnWindowFocus: false,
        enabled: !isEnded
    });

    const {
        setIsSubmitted,
        guessLocation,
        map,
        guessSubmitResponse,
        setGuessSubmitResponse,
        setGuessLocation
    } = useGameContext();

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    useEffect(() => {
        setIsSubmitted(!!guessSubmitResponse?.guess);
    }, [guessSubmitResponse, setIsSubmitted]);

    const submitGuessMutation = useMutation({
        mutationFn: async (location: MapLocation) => {
            return await gameApi.submitGuess(location);
        },
        onSuccess: (data) => {
            setGuessSubmitResponse(data);

            if (!map || !guessLocation) return;
            const bounds = new google.maps.LatLngBounds();

            bounds.extend(guessLocation);
            bounds.extend(data.target);
            map.fitBounds(bounds);
        },
        onError: (err) => {
            console.log(err);
        }
    });

    const submit = () => {
        if (!guessLocation) return;
        submitGuessMutation.mutate(guessLocation);
    };

    const moveNext = () => {
        queryClient.invalidateQueries({
            queryKey: ['randomLocation'],
        });
        setGuessLocation(null);
        setGuessSubmitResponse(null);
    };

    const leaveGame = () => {
        navigate('/');
    };

    const getDistanceLabel = (distanceInMeters: number) => {
        const distanceKm = distanceInMeters / 1000;

        if (distanceKm <= 100) {
            return { text: "Excellent", className: "text-green-400" };
        } else if (distanceKm > 100 && distanceKm <= 600) {
            return { text: "Good", className: "text-yellow-400" };
        } else {
            return { text: "Bad", className: "text-red-400" };
        }
    };

    if (isPending) {
        return (
            <div className="w-full h-full absolute inset-0 bg-[#080f1a] flex items-center justify-center text-neutral-200 font-medium">
                Loading...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full h-full absolute inset-0 bg-[#080f1a] flex items-center justify-center text-red-400 font-medium">
                Error
            </div>
        );
    }

    return (
        <div className="relative min-h-dvh w-full bg-[#080f1a] overflow-x-hidden select-none">
            {location && (
                <StreetView
                    apiKey={apiKey}
                    zoom={14}
                    className="w-full h-full absolute inset-0 z-10"
                    panoramaProps={{
                        onLoad(v) {
                            viewRef.current = v;
                            if (!location) return;
                            v.setPov({
                                heading: location.heading,
                                pitch: 5,
                            });
                            v.setPosition({
                                lat: location.lat,
                                lng: location.lng
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
            )}

            {isEnded ? (
                <button
                    className="absolute z-40 left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-6 rounded-xl w-auto sm:w-64 font-black text-sm uppercase tracking-wider py-4 px-6 transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
                    style={{
                        background: '#dc2626',
                        color: '#fff',
                        boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
                    }}
                    onClick={leaveGame}
                >
                    Finish Game!
                </button>
            ) : (
                <LocationSelectMap
                    isMoveNextBtnEnabled={!!guessSubmitResponse}
                    submitGuess={submit}
                    moveNext={moveNext}
                    apiKey={apiKey}
                    className="absolute z-30 left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 p-1.5 w-auto h-[34vh] min-h-[220px] sm:w-80 sm:h-56 md:w-96 md:h-64 rounded-2xl border border-white/10 bg-[#0c1524]/80 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out sm:hover:w-[450px] sm:hover:h-[320px]"
                >
                    <Distance
                        path={guessLocation && guessSubmitResponse?.target ? [guessLocation, guessSubmitResponse.target] : []}
                        visible={!!guessSubmitResponse?.target && !!guessLocation}
                    />

                    {guessSubmitResponse && (
                        <div className="absolute rounded-xl bg-[#080f1a]/95 border border-cyan-500/30 text-white p-3 bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center w-[calc(100%-1.5rem)] max-w-[220px] sm:min-w-[150px] shadow-lg backdrop-blur-sm animate-fade-in z-50">
                            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                                <RiPinDistanceFill size={18} className="animate-pulse" />
                                <span>Result</span>
                            </div>
                            
                            <div className="text-sm font-bold mt-1 text-neutral-50">
                                {guessSubmitResponse.distance > 1000
                                    ? `${Math.floor(guessSubmitResponse.distance / 1000)} km`
                                    : `${Math.floor(guessSubmitResponse.distance)} m`}
                            </div>

                            <div className={`text-xs font-black uppercase tracking-wide mt-0.5 ${getDistanceLabel(guessSubmitResponse.distance).className}`}>
                                {getDistanceLabel(guessSubmitResponse.distance).text}
                            </div>

                            <div className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">
                                {guessSubmitResponse.score} points
                            </div>
                        </div>
                    )}

                    {guessLocation && <GuessMarker position={guessLocation} />}
                    {guessSubmitResponse && <TargetMarker position={guessSubmitResponse.target} />}
                </LocationSelectMap>
            )}

            <GameUI />
        </div>
    );
}

export default SinglePlayer;