import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { GameContextProvider } from "./context/GameContext.tsx";
import { MultiplayerContextProvider } from "./context/MultiplayerContext.tsx";
import { MusicContextProvider, useMusic } from "./context/MusicContext.tsx";
import { useAudioPlayer } from "./hooks/useAudioPlayer.ts";

import Home from "./pages/Home/Home.tsx";
import MultiplayerGame from "./pages/MultiPlayer/MultiPlayer.tsx";
import MultiplayerMenu from "./pages/MultiPlayer/MultiplayerMenu.tsx";
import OAuthCallback from "./pages/OAuthCallback/OAuthCallback.tsx";
import SinglePlayer from "./pages/SinglePlayer/SinglePlayer.tsx";

function BackgroundMusicPlayer() {
    const { isPlaying, volume, setRoute } = useMusic();
    const location = useLocation();

    useEffect(() => {
        setRoute(location.pathname);
    }, [location.pathname, setRoute]);

    useAudioPlayer(isPlaying, volume);

    return null;
}

function App() {
    return (
        <MusicContextProvider>
            <div className="w-full h-full">
                <BackgroundMusicPlayer />

                <Toaster
                    toastOptions={{
                        style: {
                            // @ts-ignore
                            '--z-index': 1000,
                            zIndex: 'calc(var(--z-index) - var(--index))',
                        }
                    }}
                    duration={3000}
                    position='bottom-right'
                    richColors
                    closeButton
                    expand
                />

                <Routes>
                    <Route path="/" element={<Home />} />

                    <Route path="/single-game" element={
                        <GameContextProvider>
                            <SinglePlayer />
                        </GameContextProvider>
                    } />

                    <Route path="/multiplayer" element={<MultiplayerMenu />} />

                    <Route path="/multiplayer-game" element={
                        <GameContextProvider>
                            <MultiplayerContextProvider>
                                <MultiplayerGame />
                            </MultiplayerContextProvider>
                        </GameContextProvider>
                    } />

                    <Route path="/oauth/callback" element={<OAuthCallback />} />
                </Routes>
            </div>
        </MusicContextProvider>
    );
}

export default App;