import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

interface MultiplayerContextProps {
    isJoined: boolean;
    setIsJoined: Dispatch<SetStateAction<boolean>>;
    gameKey: string | null;
    setGameKey: Dispatch<SetStateAction<string | null>>;
    gameMode: '1v1' | '2v2' | null;
    setGameMode: Dispatch<SetStateAction<'1v1' | '2v2' | null>>;
}

export const MultiplayerContext = createContext<MultiplayerContextProps>({
    isJoined: false,
    setIsJoined: () => { },
    gameKey: null,
    setGameKey: () => { },
    gameMode: null,
    setGameMode: () => { },
});

export const MultiplayerContextProvider = ({ children }: { children: ReactNode }) => {
    const [isJoined, setIsJoined] = useState(false);
    const [gameKey, setGameKey] = useState<string | null>(null);
    const [gameMode, setGameMode] = useState<'1v1' | '2v2' | null>(null);

    return <MultiplayerContext.Provider value={{
        isJoined,
        setIsJoined,
        gameKey,
        setGameKey,
        gameMode,
        setGameMode,
    }}>
        {children}
    </MultiplayerContext.Provider>;
};

export const useMultiplayerContext = () => useContext(MultiplayerContext);
