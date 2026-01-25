import StreetView from "../../components/StreetView/StreetView.tsx";
import locationsData from "../../public/data/Uk-locations.json";
import { useEffect } from "react";
import * as React from "react";

function SinglePlayer() {
    const apiKey = import.meta.env.VITE_GOOGLE_API;
    const [lat, setLat] = React.useState<number>(0);
    const [lng, setLng] = React.useState<number>(0);
    const [heading, setHeading] = React.useState<number>(0);

    useEffect(() => {
        if (locationsData && locationsData.length > 0) {
            const randomElement = locationsData[Math.floor(Math.random() * locationsData.length)];
            console.log("Randomly selected element:", randomElement);
            setLat(randomElement.lat); setLng(randomElement.lng); setHeading(randomElement.heading);
        }
    }, []);

    return (
        <div className="App">
            <h1>StreetView Map</h1>
            <StreetView
                apiKey={apiKey}
                zoom={14}
                center={{lat: lat, lng: lng}}
                style={{width: "100%", height: '100vh', position: "absolute", top: 0, right: 0}}
                options={{pov: { heading: heading, pitch: 5 }, zoom: 0.5, motionTracking: false, addressControl: false, fullscreenControl: false}}
            />
        </div>
    );
}

export default SinglePlayer;