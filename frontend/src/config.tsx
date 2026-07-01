
const config = {
    backendUrl: import.meta.env.VITE_BACKEND_URL.trim().replace('./', ''),
    roundAutoMoveCooldown: 6000,
    gameEndAutoMoveCooldown: 10000,
    startingPlayerHealth: 1000,
    defeatTeamInterval: 5,
};

export default config;