import type { MapLocation } from "@/types/MapLocation";
import { Marker } from "@react-google-maps/api";
import TargetIcon from '@/public/icons/target-marker.svg';

interface TargetMarkerProps {
    position: MapLocation;
}

function TargetMarker({ position }: TargetMarkerProps) {
    return <Marker position={position} icon={TargetIcon} />;
}

export default TargetMarker;