import { GoogleMap, useJsApiLoader, StreetViewPanorama } from '@react-google-maps/api';

interface MapCenter {
    lat: number;
    lng: number;
}

interface povStructure {
    heading: number;
    pitch: number;
}

interface Options {
    pov: povStructure;
    zoom: number;
    motionTracking: boolean;
    addressControl: boolean;
    fullscreenControl: boolean;
}

interface StreetViewProps {
    apiKey: string;
    zoom: number;
    center: MapCenter;
    style: object;
    options: Options;
}

function StreetView({ apiKey, zoom, center, style, options }: StreetViewProps) {
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
                options={options}
            />
        </GoogleMap>
    );
}

export default StreetView;