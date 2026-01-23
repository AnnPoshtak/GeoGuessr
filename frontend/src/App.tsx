import React from 'react';
import StreetView from './StreetView.tsx';

const App: React.FC = () => {

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    return (
        <div className="App">
            <h1>StreenView Map</h1>
            <StreetView apiKey={apiKey} />
        </div>
    );
};

export default App;