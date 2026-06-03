import config from "@/config";
import type { Player } from "@/interfaces/Player";
import type { Team } from "@/interfaces/Team";
import { RiUser2Fill } from "react-icons/ri";

interface TeamBarProps {
    team: Team;
    rtl: boolean;
};

interface TeamPlayerProps {
    player: Player;
}

const TeamPlayer = ({player}: TeamPlayerProps) => {
    return <div>
        <RiUser2Fill />
        <p className="text-sm">{player.username}</p>
    </div>
}

const TeamBar = ({team, rtl}: TeamBarProps) => {
    return <div dir={rtl ? 'rtl': 'ltr'} className={'text-3xl flex flex-col bg-neutral-600/50 p-2'}>
        {team.players.map((p) => <TeamPlayer player={p} />)}
        <div>{team.health}</div>
        <progress className="text-red-500 h-2" value={team.health} max={config.startingPlayerHealth * team.players.length}>{team.health}</progress>
    </div>;
}
 
export default TeamBar;