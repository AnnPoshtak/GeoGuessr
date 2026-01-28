import { type MapLocation } from "@/types/MapLocation";
import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useState } from "react";
import GuessMarker from "../GuessMarker/GuessMarker";
import { useMutation } from "@tanstack/react-query";
import { default as submitGuessRequest } from "@/api/submitGuess/submitGuess";
import TargetMarker from "../TargetMarker/TargetMarker";
import queryClient from "@/api/queryClient";
import type { GuessSubmitApiResponse } from "@/types/GuessSubmitInfo";
import { RiPinDistanceFill } from "react-icons/ri";

interface LocationSelectMapProps {
    apiKey: string;
    className: string;
};

function LocationSelectMap({ apiKey, className }: LocationSelectMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });
    const mapOptions: google.maps.MapOptions = {
        disableDefaultUI: true,
        draggableCursor: 'crosshair',
        draggingCursor: 'crosshair',
    };
    const [guessLocation, setGuessLocation] = useState<MapLocation | null>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [submitInfo, setSubmitInfo] = useState<GuessSubmitApiResponse | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const submitGuessMutation = useMutation(
        {
            mutationFn: async (location: MapLocation) => {
                return await submitGuessRequest(location);
            },
            onSuccess: (data) => {
                setSubmitInfo(data);
                setIsSubmitted(true);

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

    const createMarker = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        if (isSubmitted) return;
        setGuessLocation({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        });
    };
    // Put it into useState bacause otherwise center would reset after click
    const [mapLocation] = useState<MapLocation>({
        lat: 0,
        lng: 0,
    });

    const submitGuess = () => {
        if (!guessLocation) return;
        submitGuessMutation.mutate(guessLocation);
        console.log('Guess submitted');
    };

    const moveNext = () => {
        queryClient.invalidateQueries({
            queryKey: ['randomLocation'],
        });
        setGuessLocation(null);
        setSubmitInfo(null);
        setIsSubmitted(false);
    };

    const lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1,
        scale: 3,
    };

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading...</div>;
    return <div className={className}>
        <GoogleMap onLoad={(m) => setMap(m)} onClick={createMarker} mapContainerClassName="w-full h-full border-0 rounded-2xl" options={mapOptions} center={mapLocation} zoom={1.5}>
            {submitInfo?.target && guessLocation && < TargetMarker position={submitInfo?.target} />}
            <Polyline path={
                guessLocation && submitInfo?.target ? [
                    guessLocation,
                    submitInfo?.target
                ] : []} options={
                    {
                        visible: isSubmitted && !!submitInfo?.target && !!guessLocation,
                        strokeOpacity: 0,
                        icons: [
                            {
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '15px'
                            }
                        ]
                    }
                } />
            {submitInfo && <div className="absolute rounded bg-neutral-800/70 text-neutral-50 p-2 bottom-2 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1"><RiPinDistanceFill size={24} /><span>{Math.floor(submitInfo.distance / 1000)}km</span></div>
                <div>{submitInfo.score} points</div>
            </div>}
            {guessLocation && <GuessMarker position={guessLocation} />}
        </GoogleMap>
        {isSubmitted ?
            <button className="w-full rounded bg-red-500 hover:bg-red-600 cursor-pointer p-2 text-neutral-50"
                onClick={moveNext}>Next!</button> :
            <button className="w-full rounded disabled:hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed
         bg-red-500 hover:bg-red-600 cursor-pointer p-2 text-neutral-50"
                disabled={!guessLocation} onClick={submitGuess}>Submit guess!</button>}
    </div>;
}

export default LocationSelectMap;