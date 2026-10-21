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

    if (loadError) return (
        <div className="flex items-center justify-center p-4 text-xs font-bold uppercase tracking-wider text-rose-500 bg-glass-bg backdrop-blur-md rounded-2xl border border-glass-border">
            Map loading error
        </div>
    );
    
    if (!isLoaded) return (
        <div className="flex items-center justify-center p-4 text-xs font-bold uppercase tracking-wider text-muted bg-glass-bg backdrop-blur-md rounded-2xl border border-glass-border animate-pulse">
            Loading map...
        </div>
    );

    return (
        <div className={`flex flex-col bg-glass-bg backdrop-blur-md border border-glass-border rounded-2xl p-2 shadow-2xl transition-all duration-300 ease-in-out transform origin-bottom-right hover:scale-150 z-10 hover:z-50 ${className}`}>
            <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden border border-black/5 dark:border-white/10">
                <GoogleMap 
                    onLoad={(m) => setMap(m)} 
                    onClick={createMarker} 
                    mapContainerClassName="w-full h-full border-0 rounded-xl" 
                    options={mapOptions} 
                    center={mapLocation} 
                    zoom={1.5}
                >
                    {children}
                </GoogleMap>
            </div>
            
            {!isMultiplayer && (
                <div className="mt-2 w-full shrink-0">
                    {isSubmitted && isMoveNextBtnEnabled ? (
                        <button 
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider py-3 px-4 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                            onClick={moveNext}
                        >
                            Next Round!
                        </button>
                    ) : (
                        <button 
                            className="w-full rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider py-3 px-4 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:bg-black/10 dark:disabled:bg-white/5 disabled:text-muted disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
                            disabled={isSubmitted || !guessLocation}
                            onClick={submitGuess}
                        >
                            Submit guess!
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default LocationSelectMap;