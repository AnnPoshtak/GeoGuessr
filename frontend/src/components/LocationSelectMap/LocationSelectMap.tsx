import { type MapLocation } from "@/interfaces/MapLocation";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useState, type ReactNode } from "react";
import { useGameContext } from "@/context/GameContext";

interface LocationSelectMapProps {
    apiKey: string;
    className?: string;
    moveNext: () => void;
    submitGuess: () => void;
    isMoveNextBtnEnabled?: boolean;
    isMultiplayer?: boolean;
    children?: ReactNode;
}

function LocationSelectMap({ 
    apiKey, 
    className, 
    moveNext, 
    submitGuess, 
    isMoveNextBtnEnabled, 
    isMultiplayer = false,
    children 
}: LocationSelectMapProps) {
    
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    const mapOptions: google.maps.MapOptions = {
        disableDefaultUI: true,
        draggableCursor: 'crosshair',
        draggingCursor: 'crosshair',
    };

    const { isSubmitted, guessLocation, setGuessLocation, setMap } = useGameContext();
    const [mapLocation] = useState<MapLocation>({ lat: 0, lng: 0 });

    const createMarker = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        if (isSubmitted) return;
        setGuessLocation({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        });
    };

    if (loadError) return <div className="text-neutral-400 p-4">Map loading error</div>;
    if (!isLoaded) return <div className="text-neutral-400 p-4">Loading...</div>;

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex-1 w-full h-full relative">
                <GoogleMap 
                    onLoad={(m) => setMap(m)} 
                    onClick={createMarker} 
                    mapContainerClassName="w-full h-full border-0 rounded-2xl" 
                    options={mapOptions} 
                    center={mapLocation} 
                    zoom={1.5}
                >
                    {children}
                </GoogleMap>
            </div>

            {!isMultiplayer && (
                <>
                    {isSubmitted && isMoveNextBtnEnabled ? (
                        <button 
                            className="mt-3 w-full rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold p-3 cursor-pointer transition-colors duration-200"
                            onClick={moveNext}
                        >
                            Next!
                        </button>
                    ) : (
                        <button 
                            className="mt-3 w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium p-3 transition-colors duration-200 cursor-pointer disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed"
                            disabled={isSubmitted || !guessLocation}
                            onClick={submitGuess}
                        >
                            Submit guess!
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

export default LocationSelectMap;