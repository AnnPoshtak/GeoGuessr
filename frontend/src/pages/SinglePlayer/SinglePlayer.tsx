import getRandomLocation from "@/api/getRandomLocation/getRandomLocation";
import queryClient from "@/api/queryClient";
import submitGuess from "@/api/submitGuess/submitGuess";
import GameUI from "@/components/GameUI/GameUI.tsx";
import LocationSelectMap from "@/components/LocationSelectMap/LocationSelectMap";
import StreetView from "@/components/StreetView/StreetView.tsx";
import { useGameContext } from "@/context/GameContext";
import type { MapLocation } from "@/types/MapLocation";
import type { StreetViewLocationFromApi } from "@/types/StreetViewLocationFromApi";
import { useMutation, useQuery } from "@tanstack/react-query";

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const { data: location, isPending, isError } = useQuery<StreetViewLocationFromApi>({
        queryKey: ['randomLocation'],
        queryFn: async () => await getRandomLocation(),
        retry: false,
        refetchOnWindowFocus: false,
    });
    const { guessLocation, map, setGuessSubmitResponse, setGuessLocation } = useGameContext();

    const submitGuessMutation = useMutation(
        {
            mutationFn: async (location: MapLocation) => {
                return await submitGuess(location);
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
            <StreetView
                apiKey={apiKey}
                zoom={14}
                center={{ lat: location.lat, lng: location.lng }}
                className="w-full h-full absolute z-10 top-0 right-0"
                panoramaProps={{
                    options:
                    {
                        pov:
                        {
                            heading: location.heading,
                            pitch: 5
                        },
                        zoom: 0.5,
                        motionTracking: false,
                        addressControl: false,
                        fullscreenControl: false,
                    },
                }}
            />
            <LocationSelectMap submitGuessMutation={submitGuessMutation} moveNext={moveNext} apiKey={apiKey} className="bottom-5 p-2 w-full h-1/3 sm:w-1/2 md:w-1/4 sm:h-1/4 transition-all hover:w-2/5 
            hover:h-2/5 absolute z-20 sm:bottom-10 sm:right-16 flex flex-col gap-1" />
            <GameUI />
        </div>
    );
}

export default SinglePlayer;