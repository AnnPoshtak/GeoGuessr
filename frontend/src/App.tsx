import { Route, Routes } from "react-router-dom";
import SinglePlayer from "./pages/SinglePlayer/SinglePlayer.tsx";
import OAuthCallback from "./pages/OAuthCallback/OAuthCallback.tsx";
import { Toaster } from "sonner";

function App() {
    return (
        <div className="w-full h-full">
            <Toaster toastOptions={{
                style: {
                    // @ts-ignore
                    // So toaster won't overlap with ui
                    '--z-index': 1000,
                    zIndex: 'calc(var(--z-index) - var(--index))',
                }
            }
            }
                duration={3000} position='bottom-right' richColors closeButton expand={true} />
            <Routes>
                <Route path="/" element={<SinglePlayer />}></Route>
                <Route path="/oauth/">
                    <Route path="callback" element={<OAuthCallback />} />
                </Route>
            </Routes>
        </div>
    )
}
export default App;