import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

interface MultiplayerContextProps {
    isJoined: boolean;
    setIsJoined: Dispatch<SetStateAction<boolean>>;
    gameKey: string | null;
    setGameKey: Dispatch<SetStateAction<string | null>>;
}

export const MultiplayerContext = createContext<MultiplayerContextProps>({
    isJoined: false,
    setIsJoined: () => { },
    gameKey: null,
    setGameKey: () => { },
});

export const MultiplayerContextProvider = ({ children }: { children: ReactNode }) => {
    const [isJoined, setIsJoined] = useState(false);
    const [gameKey, setGameKey] = useState<string | null>(null);

    return <MultiplayerContext.Provider value={{
        isJoined,
        setIsJoined,
        gameKey,
        setGameKey,
    }}>
        {children}
    </MultiplayerContext.Provider>;
};

export const useMultiplayerContext = () => useContext(MultiplayerContext);
