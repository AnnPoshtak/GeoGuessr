import { useEffect } from "react";
import { gameRoom, gameQueue } from "@/ws/wsClient";
import { toast } from "sonner";
import type { StreetViewLocationFromApi } from "@/interfaces/StreetViewLocationFromApi";
import type { NewRoundData, EndGameData } from "../types";

interface UseGameEventsProps {
    isJoined: boolean;
    gameKey: string | null;
    map: google.maps.Map | null;
    viewRef: React.RefObject<google.maps.StreetViewPanorama | null>;
    onNewRound: (data: NewRoundData) => void;
    onGameEnd: (data: EndGameData) => void;
    setGameState: React.Dispatch<React.SetStateAction<any>>;
    setIsPlayerConnected: (playerId: number, value: boolean) => void;
}

export const useGameEvents = ({
    isJoined,
    gameKey,
    map,
    viewRef,
    onNewRound,
    onGameEnd,
    setGameState,
    setIsPlayerConnected,
}: UseGameEventsProps) => {
    useEffect(() => {
        if (!isJoined) return;

        const messageCallback = (message: string) => toast.error(message);

        const handlePlayerReconnected = (data: { id: number; username: string }) => {
            setIsPlayerConnected(data.id, true);
            toast.info(`Player ${data.username} has reconnected!`);
        };

        const handlePlayerDisconnected = (data: { id: number; username: string }) => {
            setIsPlayerConnected(data.id, false);
            toast.info(`Player ${data.username} has disconnected!`);
        };

        const recordDefeatStarted = (data: { team: string }) => {
            setGameState((p: any) => ({ ...p, defeatTeamName: data.team }));
        };

        const recordDefeatCancelled = () => {
            setGameState((p: any) => ({ ...p, defeatTeamName: null }));
        };

        const teamSubmitted = (data: { seconds: number }) => {
            setGameState((p: any) => ({ ...p, autosubmitSeconds: data.seconds }));
        };

        const realTarget = (data: { target: StreetViewLocationFromApi }) => {
            if (viewRef.current) {
                viewRef.current.setPov({ heading: data.target.heading, pitch: 5 });
                viewRef.current.setPosition({ lat: data.target.lat, lng: data.target.lng });
            }
        };

        gameRoom.on('message', messageCallback);
        gameRoom.on('new_round', onNewRound);
        gameQueue.on('new_round', onNewRound);
        gameRoom.on('game_end', onGameEnd);
        gameQueue.on('game_end', onGameEnd);
        gameRoom.on('player_reconnected', handlePlayerReconnected);
        gameRoom.on('player_disconnected', handlePlayerDisconnected);
        gameRoom.on('record_defeat_started', recordDefeatStarted);
        gameRoom.on('record_defeat_cancelled', recordDefeatCancelled);
        gameRoom.on('team_submitted', teamSubmitted);
        gameRoom.on('real_target', realTarget);

        return () => {
            gameRoom.off('new_round', onNewRound);
            gameQueue.off('new_round', onNewRound);
            gameRoom.off('game_end', onGameEnd);
            gameQueue.off('game_end', onGameEnd);
            gameRoom.off('message', messageCallback);
            gameRoom.off('player_reconnected');
            gameRoom.off('player_disconnected');
            gameRoom.off('record_defeat_started', recordDefeatStarted);
            gameRoom.off('record_defeat_cancelled', recordDefeatCancelled);
            gameRoom.off('team_submitted', teamSubmitted);
            gameRoom.off('real_target', realTarget);
        };
    }, [isJoined, gameKey, map]);
};