import { GoogleMap, useJsApiLoader, StreetViewPanorama, type StreetViewPanoramaProps } from '@react-google-maps/api';

interface StreetViewProps {
    apiKey: string;
    zoom: number;
    className?: string;
    panoramaProps: StreetViewPanoramaProps;
}

function StreetView({ apiKey, zoom, className, panoramaProps }: StreetViewProps) {
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
        visible: true,
        options: streetViewOptions
    }

    return (
        <GoogleMap
            mapContainerClassName={className}
            heading={streetViewProps.options?.pov?.heading}
            zoom={zoom}
        >
            <StreetViewPanorama
                {...streetViewProps}
            />
        </GoogleMap>
    );
}

export default StreetView;