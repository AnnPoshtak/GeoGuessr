
const config = {
    backendUrl: import.meta.env.VITE_BACKEND_URL.trim().replace('./', ''),
    roundAutoMoveCooldown: 6000,
    gameEndAutoMoveCooldown: 10000,
};

export default config;