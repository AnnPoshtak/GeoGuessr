import { gameApi } from "@/api";
import queryClient from "@/api/queryClient";
import Distance from "@/components/Distance/Distance";
import { GameHeader } from "@/components/GameHeader/GameHeader";
import { GuessResultCard } from "@/components/GuessResultCard/GuessResultCard";
import GuessMarker from "@/components/GuessMarker/GuessMarker";
import LocationSelectMap from "@/components/LocationSelectMap/LocationSelectMap";
import StreetView from "@/components/StreetView/StreetView.tsx";
import TargetMarker from "@/components/TargetMarker/TargetMarker";
import { useGameContext } from "@/context/GameContext";
import type { MapLocation } from "@/interfaces/MapLocation";
import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const isOnline = useOnlineStatus();

    const {
        setIsSubmitted,
        guessLocation,
        map,
        guessSubmitResponse,
        setGuessSubmitResponse,
        setGuessLocation,
        score,
        totalGuesses,
        correctGuesses,
        closeGuesses,
        notGuesses,
    } = useGameContext();

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
    });

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
        <div className="relative min-h-dvh w-full bg-[#080f1a] overflow-hidden select-none">
            <GameHeader 
                score={score}
                totalGuesses={totalGuesses}
                correctGuesses={correctGuesses}
                closeGuesses={closeGuesses}
                missedGuesses={notGuesses}
            />

            {!isOnline && (
                <div className="absolute top-[50%] left-[50%] z-50 animate-pulse -translate-x-1/2 -translate-y-1/2">
                    <WifiOff className="h-6 w-6 text-red-500" />
                </div>
            )}

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

            <LocationSelectMap
                isMoveNextBtnEnabled={!!guessSubmitResponse}
                submitGuess={submit}
                moveNext={moveNext}
                apiKey={apiKey}
                className="absolute z-30 left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 p-1.5 w-auto h-[34vh] min-h-[220px] sm:w-80 sm:h-56 md:w-96 md:h-64 rounded-2xl transition-all duration-300 ease-out sm:hover:w-[450px] sm:hover:h-[320px]"
            >
                <Distance
                    path={guessLocation && guessSubmitResponse?.target ? [guessLocation, guessSubmitResponse.target] : []}
                    visible={!!guessSubmitResponse?.target && !!guessLocation}
                />

                {guessSubmitResponse && (
                    <GuessResultCard response={guessSubmitResponse} />
                )}

                {guessLocation && <GuessMarker position={guessLocation} />}
                {guessSubmitResponse && <TargetMarker position={guessSubmitResponse.target} />}
            </LocationSelectMap>
        </div>
    );
}

export default SinglePlayer;