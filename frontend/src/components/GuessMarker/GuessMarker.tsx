import type { MapLocation } from "@/types/MapLocation";
import { Marker } from "@react-google-maps/api";
import UserIcon from '@/public/icons/guess-marker.svg';

interface GuessMarkerProps {
    position: MapLocation;
}

function GuessMarker({ position }: GuessMarkerProps) {
    return <Marker position={position} icon={UserIcon} />;
}

export default GuessMarker;