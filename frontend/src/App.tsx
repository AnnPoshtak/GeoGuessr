import {Route, Routes} from "react-router-dom";
import SinglePlayer from "./pages/SinglePlayer/SinglePlayer.tsx";

function App(){
    return (
        <Routes>
            <Route path="/" element={<SinglePlayer/>}></Route>
        </Routes>
    )
}
export default App;