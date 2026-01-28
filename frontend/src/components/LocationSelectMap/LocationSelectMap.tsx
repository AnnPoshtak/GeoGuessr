import { type MapLocation } from "@/types/MapLocation";
import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import GuessMarker from "../GuessMarker/GuessMarker";
import TargetMarker from "../TargetMarker/TargetMarker";
import { RiPinDistanceFill } from "react-icons/ri";
import { useGameContext } from "@/context/GameContext";
import type { GuessSubmitApiResponse } from "@/types/GuessSubmitApiResponse";
import type { UseMutationResult } from "@tanstack/react-query";

interface LocationSelectMapProps {
    apiKey: string;
    className: string;
    moveNext: () => void;
    submitGuessMutation: UseMutationResult<GuessSubmitApiResponse, Error, MapLocation, unknown>,
};

function LocationSelectMap({ apiKey, className, moveNext, submitGuessMutation }: LocationSelectMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });
    const mapOptions: google.maps.MapOptions = {
        disableDefaultUI: true,
        draggableCursor: 'crosshair',
        draggingCursor: 'crosshair',
    };
    const { guessLocation, setGuessLocation,
        guessSubmitResponse, setMap } = useGameContext();
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    useEffect(() => setIsSubmitted(!!guessSubmitResponse?.guess), [guessSubmitResponse]);

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

    const lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1,
        scale: 3,
    };

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading...</div>;
    return <div className={className}>
        <GoogleMap onLoad={(m) => setMap(m)} onClick={createMarker} mapContainerClassName="w-full h-full border-0 rounded-2xl" options={mapOptions} center={mapLocation} zoom={1.5}>
            {guessSubmitResponse?.target && guessLocation && < TargetMarker position={guessSubmitResponse?.target} />}
            <Polyline path={
                guessLocation && guessSubmitResponse?.target ? [
                    guessLocation,
                    guessSubmitResponse?.target
                ] : []} options={
                    {
                        visible: isSubmitted && !!guessSubmitResponse?.target && !!guessLocation,
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
            {guessSubmitResponse && <div className="absolute rounded bg-neutral-800/70 text-neutral-50 p-2 bottom-2 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1"><RiPinDistanceFill size={24} /><span>{Math.floor(guessSubmitResponse.distance / 1000)}km</span></div>
                <div>{guessSubmitResponse.score} points</div>
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