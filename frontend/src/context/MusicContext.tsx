import { createContext, useContext, useState, type ReactNode } from "react";

interface MusicContextProps {
  volume: number;
  isPlaying: boolean;
  route: string;
  setVolume: (vol: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setRoute: (route: string) => void;
}

export const MusicContext = createContext<MusicContextProps | undefined>(undefined);

export const MusicContextProvider = ({ children }: { children: ReactNode }) => {
  const [volume, setVolume] = useState<number>(0.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [route, setRoute] = useState<string>("/");

  return (
    <MusicContext.Provider value={{ volume, isPlaying, route, setVolume, setIsPlaying, setRoute }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic error");
  return context;
};