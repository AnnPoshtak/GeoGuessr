import GameUI from "@/components/GameUI/GameUI.tsx";
import StreetView from "@/components/StreetView/StreetView.tsx";
import locationsData from "@/public/data/Uk-locations.json";
import { useEffect, useState } from "react";

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const [lat, setLat] = useState<number>(0);
    const [lng, setLng] = useState<number>(0);
    const [heading, setHeading] = useState<number>(0);

    useEffect(() => {
        if (locationsData && locationsData.length > 0) {
            const randomElement = locationsData[Math.floor(Math.random() * locationsData.length)];
            console.log("Randomly selected element:", randomElement);
            setLat(randomElement.lat);
            setLng(randomElement.lng);
            setHeading(randomElement.heading);
        }
    }, []);

    return (
        <div className="App">
            <StreetView
                apiKey={apiKey}
                zoom={14}
                center={{ lat: lat, lng: lng }}
                style={{ width: "100%", height: '100vh', position: "absolute", top: 0, right: 0, zIndex: 10 }}
                panoramaProps={{
                    options:
                        { pov: { heading: heading, pitch: 5 }, zoom: 0.5, motionTracking: false, addressControl: false, fullscreenControl: false }
                }}
            />
            <GameUI />
        </div>
    );
}

export default SinglePlayer;