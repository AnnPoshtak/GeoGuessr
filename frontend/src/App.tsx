import StreetView from './components/StreetView/StreetView.tsx';

function App() {
    const apiKey = "API_KEY";

    return (
        <div className="App">
            <h1>StreetView Map</h1>
            <StreetView apiKey={apiKey} zoom={14} center={{lat: 48.8625, lng: 2.2882}} style={{width: "100%", height: '100vh', position: "absolute", top: 0, right: 0}}/>
        </div>
    );
}

export default App;