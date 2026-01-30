import type { GuessSubmitApiResponse } from "@/types/GuessSubmitApiResponse";
import type { MapLocation } from "@/types/MapLocation";
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

interface GameContextProps {
    guessLocation: MapLocation | null;
    setGuessLocation: Dispatch<SetStateAction<MapLocation | null>>;
    guessSubmitResponse: GuessSubmitApiResponse | null;
    setGuessSubmitResponse: Dispatch<SetStateAction<GuessSubmitApiResponse | null>>;
    map: google.maps.Map | null;
    setMap: Dispatch<SetStateAction<google.maps.Map | null>>;
};

export const GameContext = createContext<GameContextProps>({
    guessLocation: null,
    setGuessLocation: () => { },
    guessSubmitResponse: null,
    setGuessSubmitResponse: () => { },
    map: null,
    setMap: () => { },
});

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
    const [guessLocation, setGuessLocation] = useState<MapLocation | null>(null);
    const [guessSubmitResponse, setGuessSubmitResponse] = useState<GuessSubmitApiResponse | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    return <GameContext.Provider value={{
        guessLocation, setGuessLocation,
        guessSubmitResponse, setGuessSubmitResponse,
        map, setMap
    }}>
        {children}
    </GameContext.Provider>
}

export const useGameContext = () => useContext(GameContext);