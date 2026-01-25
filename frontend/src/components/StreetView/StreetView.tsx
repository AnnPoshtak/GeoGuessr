import { GoogleMap, useJsApiLoader, StreetViewPanorama, type StreetViewPanoramaProps } from '@react-google-maps/api';
import type { CSSProperties } from 'react';

interface MapCenter {
    lat: number;
    lng: number;
}

interface StreetViewProps {
    apiKey: string;
    zoom: number;
    center: MapCenter;
    style: CSSProperties;
    panoramaProps: StreetViewPanoramaProps;
}

function StreetView({ apiKey, zoom, center, style, panoramaProps }: StreetViewProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    if (loadError) return <div>Map loading error</div>;
    if (!isLoaded) return <div>Loading...</div>;

    const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
        ...panoramaProps.options,
        enableCloseButton: false
    }

    const streetViewProps: StreetViewPanoramaProps = {
        ...panoramaProps,
        // @ts-ignore
        position: center,
        // @ts-ignore
        visible: true,
        options: streetViewOptions
    }

    return (
        <>
            <GoogleMap
                mapContainerStyle={style}
                center={center}
                zoom={zoom}
            >
                <StreetViewPanorama
                    {...streetViewProps}
                />
            </GoogleMap>
        </>

    );
}

export default StreetView;