import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { GameContextProvider } from "@/context/GameContext.tsx";
import { MultiplayerContextProvider } from "@/context/MultiplayerContext.tsx";
import { SEO } from "@/SEO.tsx";

const Home = lazy(() => import("@/pages/Home/Home.tsx"));
const SinglePlayer = lazy(() => import("@/pages/SinglePlayer/SinglePlayer.tsx"));
const MultiplayerMenu = lazy(() => import("@/pages/MultiPlayer/MultiplayerMenu.tsx"));
const MultiplayerGame = lazy(() => import("@/pages/MultiPlayer/MultiPlayer.tsx"));
const OAuthCallback = lazy(() => import("@/pages/OAuthCallback/OAuthCallback.tsx"));
const Profile = lazy(() => import("@/pages/Profile/Profile.tsx"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound.tsx"));

const PageLoader = () => (
    <div className="w-screen h-screen flex items-center justify-center bg-game-bg text-muted font-bold tracking-widest uppercase animate-pulse">
        Loading...
    </div>
);

function Router() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={
                    <>
                        <SEO 
                            title="Explore & Guess Locations Worldwide" 
                            description="Test your geography skills, guess random world locations, and compete with players in real-time multiplayer mode."
                        />
                        <Home />
                    </>
                } />

                <Route path="/single-game" element={
                    <GameContextProvider>
                        <SEO 
                            title="Singleplayer Game" 
                            description="Explore the world at your own pace. Guess locations using Street View and sharpen your geography knowledge."
                        />
                        <SinglePlayer />
                    </GameContextProvider>
                } />

                <Route path="/multiplayer" element={
                    <>
                        <SEO 
                            title="Multiplayer Lobby" 
                            description="Challenge other players in 1v1 duels or 2v2 team geography battles."
                        />
                        <MultiplayerMenu />
                    </>
                } />

                <Route path="/multiplayer-game" element={
                    <GameContextProvider>
                        <MultiplayerContextProvider>
                            <SEO title="Live Multiplayer Game" noindex />
                            <MultiplayerGame />
                        </MultiplayerContextProvider>
                    </GameContextProvider>
                } />

                <Route path="/profile" element={
                    <>
                        <SEO title="My Profile" noindex />
                        <Profile />
                    </>
                } />

                <Route path="/oauth/callback" element={
                    <>
                        <SEO title="Authenticating..." noindex />
                        <OAuthCallback />
                    </>
                } />

                <Route path="*" element={
                    <>
                        <SEO title="Page Not Found (404)" noindex />
                        <NotFound />
                    </>
                } />
            </Routes>
        </Suspense>
    );
}

export default Router;