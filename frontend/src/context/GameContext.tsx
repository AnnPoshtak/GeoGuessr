import type { GuessSubmitApiResponse } from "@/interfaces/GuessSubmitApiResponse";
import type { MapLocation } from "@/interfaces/MapLocation";
import { createContext, useContext, useState, useEffect, type Dispatch, type ReactNode, type SetStateAction } from "react";

import correctSound from "../public/sound/correct.mp3";
import okSound from "../public/sound/ok.mp3";
import wrongSound from "../public/sound/wrong.mp3";

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
    score: number;
    setScore: Dispatch<SetStateAction<number>>;

    totalGuesses: number;
    correctGuesses: number;
    closeGuesses: number;
    notGuesses: number;
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
    score: 0,
    setScore: () => { },

    totalGuesses: 0,
    correctGuesses: 0,
    closeGuesses: 0,
    notGuesses: 0,
});

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
    const [guessLocation, setGuessLocation] = useState<MapLocation | null>(null);
    const [guessSubmitResponse, setGuessSubmitResponse] = useState<GuessSubmitApiResponse | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [score, setScore] = useState<number>(0);

    const [totalGuesses, setTotalGuesses] = useState<number>(0);
    const [correctGuesses, setCorrectGuesses] = useState<number>(0);
    const [closeGuesses, setCloseGuesses] = useState<number>(0);
    const [notGuesses, setNotGuesses] = useState<number>(0);

    const playResultSound = (distInKm: number) => {
        const PERFECT_DISTANCE = 100;
        const OK_DISTANCE = 600;

        let soundSource = wrongSound;
        let resultType = "wrong";

        if (distInKm < PERFECT_DISTANCE) {
            soundSource = correctSound;
            resultType = "correct";
        } else if (distInKm >= PERFECT_DISTANCE && distInKm <= OK_DISTANCE) {
            soundSource = okSound;
            resultType = "ok";
        }

        if (isSoundOn) {
            const audio = new Audio(soundSource);
            audio.volume = 0.5;
            audio.play().catch(err => console.log("Audio play error:", err));
        }

        return resultType;
    };

    useEffect(() => {
        if (guessSubmitResponse && typeof guessSubmitResponse.distance === "number") {
            const distanceInKm = guessSubmitResponse.distance / 1000;
            const result = playResultSound(distanceInKm);

            setTotalGuesses(prev => prev + 1);

            if (typeof guessSubmitResponse.score === "number") {
                setScore(prev => prev + guessSubmitResponse.score);
            }
            
            if (result === "correct") setCorrectGuesses(prev => prev + 1);
            if (result === "ok") setCloseGuesses(prev => prev + 1);
            if (result === "wrong") setNotGuesses(prev => prev + 1);
        }
    }, [guessSubmitResponse]);

    return <GameContext.Provider value={{
        guessLocation, setGuessLocation,
        guessSubmitResponse, setGuessSubmitResponse,
        map, setMap, isSubmitted, setIsSubmitted,
        isSoundOn, setIsSoundOn,
        score, setScore,
        totalGuesses,
        correctGuesses,
        closeGuesses,
        notGuesses
    }}>
        {children}
    </GameContext.Provider>
}

export const useGameContext = () => useContext(GameContext);