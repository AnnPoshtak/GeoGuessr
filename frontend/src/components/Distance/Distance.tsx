import type { MapLocation } from "@/interfaces/MapLocation";
import { PolylineF } from "@react-google-maps/api";

interface DistanceProps {
    path: MapLocation[],
    visible: boolean
}

function Distance({ path, visible }: DistanceProps) {
    const lineSymbol = {
        path: "M 0,-1 0,1",
        strokeOpacity: 1,
        scale: 3,
    };
    return <PolylineF onUnmount={(p) => p.setMap(null)} path={path} options={
        {
            visible: visible,
            strokeOpacity: 0,
            icons: [
                {
                    icon: lineSymbol,
                    offset: '0',
                    repeat: '15px'
                }
            ]
        }
    } />;
}

export default Distance;