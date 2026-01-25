import { type MapLocation } from "@/types/MapLocation";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useState } from "react";

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
    const [markerLocation, setMarkerLocation] = useState<MapLocation | null>(null);

    const createMarker = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        setMarkerLocation({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        })
    };
    // Put it into useState bacause otherwise center would reset after click
    const [mapLocation] = useState<MapLocation>({
        lat: 0,
        lng: 0,
    });

    const submitGuess = () => {
        if (!markerLocation) return;
        console.log('Guess submitted');
    };

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading...</div>;
    return <div className={className}>
        <GoogleMap onClick={createMarker} mapContainerClassName="w-full h-full border-0 rounded-2xl" options={mapOptions} center={mapLocation} zoom={1.5}>
            {markerLocation && <Marker position={markerLocation} />}
        </GoogleMap>
        <button className="w-full rounded disabled:hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed
         bg-red-500 hover:bg-red-600 cursor-pointer p-2 text-neutral-50"
            disabled={!markerLocation} onClick={submitGuess}>Submit guess!</button>
    </div>;
}

export default LocationSelectMap;