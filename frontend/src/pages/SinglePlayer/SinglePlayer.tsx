import getRandomLocation from "@/api/getRandomLocation/getRandomLocation";
import GameUI from "@/components/GameUI/GameUI.tsx";
import StreetView from "@/components/StreetView/StreetView.tsx";
import type { MapLocation } from "@/types/MapLocation";
import { useQuery } from "@tanstack/react-query";

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const { data: location, isPending, isError } = useQuery<MapLocation>({
        queryKey: ['randomLocation'],
        queryFn: async () => {
            const resp = await getRandomLocation();
            if (!resp) return;
            return resp.json();
        },
        retry: false,
        refetchOnWindowFocus: false,
    });

    if (isPending) return <div>Loading...</div>
    if (isError) return <div>Error</div>

    return (
        <div className="App">
            <StreetView
                apiKey={apiKey}
                zoom={14}
                center={{ lat: location.lat, lng: location.lng }}
                style={{ width: "100%", height: '100vh', position: "absolute", top: 0, right: 0, zIndex: 10 }}
                panoramaProps={{
                    options:
                        { pov: { heading: location.heading, pitch: 5 }, zoom: 0.5, motionTracking: false, addressControl: false, fullscreenControl: false }
                }}
            />
            <GameUI />
        </div>
    );
}

export default SinglePlayer;