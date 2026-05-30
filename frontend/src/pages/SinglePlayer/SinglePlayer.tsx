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
import { useEffect, useRef } from "react";
import { RiPinDistanceFill } from "react-icons/ri";

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
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
            };
            return data;
        },
        retry: false,
        refetchOnWindowFocus: false,
    });
    const { setIsSubmitted, guessLocation, map, guessSubmitResponse, setGuessSubmitResponse, setGuessLocation } = useGameContext();

    const viewRef = useRef<google.maps.StreetViewPanorama | null>(null);

    useEffect(() => setIsSubmitted(!!guessSubmitResponse?.guess), [guessSubmitResponse]);

    const submitGuessMutation = useMutation(
        {
            mutationFn: async (location: MapLocation) => {
                return await gameApi.submitGuess(location);
            },
            onSuccess: (data) => {
                setGuessSubmitResponse(data);

                if (!map) return;
                if (!guessLocation) return;
                const bounds = new google.maps.LatLngBounds();

                bounds.extend(guessLocation);
                bounds.extend(data.target);
                map.fitBounds(bounds);
            },
            onError: (err) => {
                console.log(err);
            }
        }
    );

    const submit = () => {
        if (!guessLocation) return;
        submitGuessMutation.mutate(guessLocation);
        console.log('Guess submitted');
    };

    const moveNext = () => {
        queryClient.invalidateQueries({
            queryKey: ['randomLocation'],
        });
        setGuessLocation(null);
        setGuessSubmitResponse(null);
    }

    if (isPending) return <div>Loading...</div>
    if (isError) return <div>Error</div>

    return (
        <div>
            {location && <StreetView
                apiKey={apiKey}
                zoom={14}
                className="w-full h-full absolute z-10 top-0 right-0"
                panoramaProps={{
                    onLoad(v) {
                        viewRef.current = v;
                        if (!location) return;
                        v.setPov({
                            heading: location.heading,
                            pitch: 5,
                        });
                        v.setPosition({
                            lat: location.lat, lng: location.lng
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
            />}
            <LocationSelectMap isMoveNextBtnEnabled={true} submitGuess={submit} moveNext={moveNext} apiKey={apiKey} className="bottom-5 p-2 w-full h-1/3 sm:w-1/2 md:w-1/4 sm:h-1/4 transition-all hover:w-2/5 
            hover:h-2/5 absolute z-20 sm:bottom-10 sm:right-16 flex flex-col gap-1">
                <Distance path={guessLocation && guessSubmitResponse?.target ? [
                    guessLocation,
                    guessSubmitResponse?.target
                ] : []} visible={!!guessSubmitResponse?.target && !!guessLocation} />
                {guessSubmitResponse && <div className="absolute rounded bg-neutral-800/70 text-neutral-50 p-2 bottom-2 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1"><RiPinDistanceFill size={24} /><span>{Math.floor(guessSubmitResponse.distance / 1000)}km</span></div>
                    <div>{guessSubmitResponse.score} points</div>
                </div>}
                {guessLocation && <GuessMarker position={guessLocation} />}
                {guessSubmitResponse && <TargetMarker position={guessSubmitResponse.target} />}
            </LocationSelectMap>
            <GameUI />
        </div>
    );
}

export default SinglePlayer;