import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import SinglePlayer from "./pages/SinglePlayer/SinglePlayer.tsx";
import OAuthCallback from "./pages/OAuthCallback/OAuthCallback.tsx";
import Home from "./pages/Home/Home.tsx";
import { Toaster } from "sonner";
import { GameContextProvider } from "./context/GameContext.tsx";
import { MultiplayerContextProvider } from "./context/MultiplayerContext.tsx";
import Multiplayer from "./pages/MultiPlayer/MultiPlayer.tsx";

import Music1 from "./public/sound/music1.mp3";
import Music2 from "./public/sound/music2.mp3";
import Music3 from "./public/sound/music3.mp3";

import { MusicContextProvider, useMusic } from "./context/MusicContext.tsx";

const PLAYLIST = [Music1, Music2, Music3];

export function BackgroundMusicPlayer() {
    const location = useLocation();
    const { isPlaying, volume, setRoute } = useMusic();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [currentTrack, setCurrentTrack] = useState(() => {
        const randomIndex = Math.floor(Math.random() * PLAYLIST.length);
        return PLAYLIST[randomIndex];
    });

    useEffect(() => {
        setRoute(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        if (!audioRef.current) return;

        const isInGame = location.pathname === "/single-game" || location.pathname === "/multiplayer";
        audioRef.current.volume = isInGame ? volume * 0.15 : volume;

        if (isPlaying) {
            audioRef.current.play().catch(() => {
                console.log("Фонова музика чекає на перший клік по екрану...");
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, volume, location.pathname, currentTrack]); 

    useEffect(() => {
        const handleUnlock = () => {
            if (isPlaying && audioRef.current) {
                audioRef.current.play().catch(() => {});
            }
        };
        window.addEventListener("click", handleUnlock);
        return () => window.removeEventListener("click", handleUnlock);
    }, [isPlaying]);

    const handleEnded = () => {
        const randomIndex = Math.floor(Math.random() * PLAYLIST.length);
        setCurrentTrack(PLAYLIST[randomIndex]);
    };

    return (
        <audio 
            ref={audioRef} 
            src={currentTrack} 
            onEnded={handleEnded}
        />
    );
}

function App() {
    return (
        <MusicContextProvider>
            <div className="w-full h-full">
                <BackgroundMusicPlayer />

                <Toaster toastOptions={{
                    style: {
                        // @ts-ignore
                        '--z-index': 1000,
                        zIndex: 'calc(var(--z-index) - var(--index))',
                    }
                }} duration={3000} position='bottom-right' richColors closeButton expand={true} />
                
                <Routes>
                    <Route path="/" element={<Home/>} />
                    <Route path="/single-game" element={
                        <GameContextProvider>
                            <SinglePlayer />
                        </GameContextProvider>
                    }></Route>
                    <Route path="/multiplayer" element={
                        <GameContextProvider>
                            <MultiplayerContextProvider>
                                <Multiplayer />
                            </MultiplayerContextProvider>
                        </GameContextProvider>
                    }></Route>
                    <Route path="/oauth/">
                        <Route path="callback" element={<OAuthCallback />} />
                    </Route>
                </Routes>
            </div>
        </MusicContextProvider>
    )
}
export default App;