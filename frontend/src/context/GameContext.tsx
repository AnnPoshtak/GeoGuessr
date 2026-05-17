import type { GuessSubmitApiResponse } from "@/interfaces/GuessSubmitApiResponse";
import type { MapLocation } from "@/interfaces/MapLocation";
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

interface GameContextProps {
    guessLocation: MapLocation | null;
    setGuessLocation: Dispatch<SetStateAction<MapLocation | null>>;
    guessSubmitResponse: GuessSubmitApiResponse | null;
    setGuessSubmitResponse: Dispatch<SetStateAction<GuessSubmitApiResponse | null>>;
    map: google.maps.Map | null;
    setMap: Dispatch<SetStateAction<google.maps.Map | null>>;
    isSubmitted: boolean;
    setIsSubmitted: Dispatch<SetStateAction<boolean>>;
    isSoundOn: boolean;
    setIsSoundOn: Dispatch<SetStateAction<boolean>>;
}

export const GameContext = createContext<GameContextProps>({
    guessLocation: null,
    setGuessLocation: () => { },
    guessSubmitResponse: null,
    setGuessSubmitResponse: () => { },
    map: null,
    setMap: () => { },
    isSubmitted: false,
    setIsSubmitted: () => { },
    isSoundOn: true,
    setIsSoundOn: () => { },
});

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
    const [guessLocation, setGuessLocation] = useState<MapLocation | null>(null);
    const [guessSubmitResponse, setGuessSubmitResponse] = useState<GuessSubmitApiResponse | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(true);

    return <GameContext.Provider value={{
        guessLocation, setGuessLocation,
        guessSubmitResponse, setGuessSubmitResponse,
        map, setMap, isSubmitted, setIsSubmitted,
        isSoundOn, setIsSoundOn
    }}>
        {children}
    </GameContext.Provider>
}

export const useGameContext = () => useContext(GameContext);