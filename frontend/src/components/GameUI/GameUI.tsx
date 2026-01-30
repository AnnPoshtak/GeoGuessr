import MenuButton from "../MenuButton/MenuButton";

function GameUI() {
    return <div className="absolute pointer-events-none z-50 top-0 bottom-0 h-100vh w-full">
        <div className="relative w-full h-full *:pointer-events-auto">
            <MenuButton />
        </div>
    </div>;
}

export default GameUI;