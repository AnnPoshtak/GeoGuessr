import { GoogleMap, useJsApiLoader, StreetViewPanorama } from '@react-google-maps/api';

interface MapCenter {
    lat: number;
    lng: number;
}

interface StreetViewProps {
    apiKey: string;
    zoom: number;
    center: MapCenter;
    style: object;
}

function StreetView({ apiKey, zoom, center, style }: StreetViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading...</div>;

    return (
        <GoogleMap
            mapContainerStyle={style}
            center={center}
            zoom={zoom}
        >
            <StreetViewPanorama
                position={center}
                visible={true}
                options={{
                    pov: { heading: 135, pitch: 5 },
                    zoom: 0.5,
                    motionTracking: false,
                    addressControl: false,
                    fullscreenControl: false
                }}
            />
        </GoogleMap>
    );
}

export default StreetView;