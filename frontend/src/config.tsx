// @ts-ignore
import ymlConfig from '#root/shared/config.yml';

const config = {
    backendUrl: import.meta.env.VITE_BACKEND_URL.trim().replace('./', ''),
    roundAutomoveCooldown: ymlConfig.round_automove_cooldown,
    gameEndAutomoveCooldown: ymlConfig.game_end_automove_cooldown,
    startingPlayerHealth: ymlConfig.starting_player_health,
    defeatTeamInterval: ymlConfig.defeat_team_interval,
};

export default config;