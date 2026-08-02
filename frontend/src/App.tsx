import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { MusicContextProvider, useMusic } from "./context/MusicContext.tsx";
import { UserContextProvider } from './context/UserContext.tsx';
import { useAudioPlayer } from "./hooks/useAudioPlayer.ts";
import Router from "./routers/Router.tsx";
import { ui } from "./firebase.ts";
import {FirebaseUIProvider} from '@firebase-oss/ui-react';
import { SocketContextProvider } from "./context/SocketContext.tsx";

export const BackgroundMusicPlayer = () => {
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
                <FirebaseUIProvider ui={ui}>
                    <UserContextProvider>
                        <SocketContextProvider>
                            <Router />
                        </SocketContextProvider>
                    </UserContextProvider>
                </FirebaseUIProvider>
            </div>
        </MusicContextProvider>
    );
}

export default App;