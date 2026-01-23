import React from 'react';
import { GoogleMap, useJsApiLoader, StreetViewPanorama } from '@react-google-maps/api';

const containerStyle = {
    width: "100%",
    height: '100vh',
    position: "absolute",
    top: 0,
    right: 0
};

// Paris, Elfeva Tower
const defaultCenter = {
    lat: 48.8625,
    lng: 2.2882
};

interface StreetViewProps {
    apiKey: string;
}

const StreetView: React.FC<StreetViewProps> = ({ apiKey }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    if (loadError) return <div>Помилка завантаження карти</div>;
    if (!isLoaded) return <div>Завантаження...</div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={14}
        >
            <StreetViewPanorama
                position={defaultCenter}
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
};

export default StreetView;