import { Route, Routes } from "react-router-dom";

import { GameContextProvider } from "@/context/GameContext.tsx";
import { MultiplayerContextProvider } from "@/context/MultiplayerContext.tsx";

import Home from "@/pages/Home/Home.tsx";
import MultiplayerGame from "@/pages/MultiPlayer/MultiPlayer.tsx";
import MultiplayerMenu from "@/pages/MultiPlayer/MultiplayerMenu.tsx";
import SinglePlayer from "@/pages/SinglePlayer/SinglePlayer.tsx";
import Login from "@/pages/Auth/Login";

function Router() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/single-game" element={
                <GameContextProvider>
                    <SinglePlayer />
                </GameContextProvider>
            } />

            <Route path="/multiplayer" element={<MultiplayerMenu />} />
            <Route path="/auth/">
                <Route path="login" element={<Login />} />
            </Route>

            <Route path="/multiplayer-game" element={
                <GameContextProvider>
                    <MultiplayerContextProvider>
                        <MultiplayerGame />
                    </MultiplayerContextProvider>
                </GameContextProvider>
            } />

        </Routes>
    );
}

export default Router;