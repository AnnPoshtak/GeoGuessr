import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  const [volume, setVolume] = useState<number>(() => {
    const savedVolume = localStorage.getItem("volume");
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });
  
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [route, setRoute] = useState<string>("/");

  useEffect(() => {
    localStorage.setItem("volume", volume.toString());
  }, [volume]);

  return (
    <MusicContext.Provider value={{ volume, isPlaying, route, setVolume, setIsPlaying, setRoute }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicContextProvider");
  }
  return context;
};