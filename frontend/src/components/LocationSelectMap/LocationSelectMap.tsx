import { type MapLocation } from "@/interfaces/MapLocation";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useState, type ReactNode } from "react";
import { useGameContext } from "@/context/GameContext";

interface LocationSelectMapProps {
    apiKey: string;
    className?: string;
    moveNext: () => void;
    submitGuess: () => void,
    isMoveNextBtnEnabled?: boolean,
    children?: ReactNode
};

function LocationSelectMap({ apiKey, className, moveNext, submitGuess, isMoveNextBtnEnabled, children }: LocationSelectMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });
    const mapOptions: google.maps.MapOptions = {
        disableDefaultUI: true,
        draggableCursor: 'crosshair',
        draggingCursor: 'crosshair',
    };
    const { isSubmitted, setGuessLocation, setMap } = useGameContext();

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

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading...</div>;
    return <div className={className}>
        <GoogleMap onLoad={(m) => setMap(m)} onClick={createMarker} mapContainerClassName="w-full h-full border-0 rounded-2xl" options={mapOptions} center={mapLocation} zoom={1.5}>
            {children}
        </GoogleMap>
        {isSubmitted && isMoveNextBtnEnabled ?
            <button className="w-full rounded bg-red-500 hover:bg-red-600 cursor-pointer p-2 text-neutral-50"
                onClick={moveNext}>Next!</button> :
            <button className="w-full rounded disabled:hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed
         bg-red-500 hover:bg-red-600 cursor-pointer p-2 text-neutral-50"
                disabled={isSubmitted} onClick={submitGuess}>Submit guess!</button>}
    </div>;
}

export default LocationSelectMap;