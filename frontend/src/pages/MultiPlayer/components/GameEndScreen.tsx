import type { Team } from "@/interfaces/Team";
import type { GameRoom } from "@/interfaces/GameRoom";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Crown, XCircle } from "lucide-react";

interface GameEndScreenProps {
    teams: Team[];
    game: GameRoom | null | undefined;
    onClose: () => void;
    scores?: Record<string, number>;
}

export default function GameEndScreen ({ teams, game, onClose, scores }: GameEndScreenProps){
    const navigate = useNavigate();
    const { user } = useUser();

    const endGamePhrases = [
        'Maps can trick you, but practice makes every turn feel sharper.',
        'Great explorers learn from every guess — the next one will be closer.',
        'Keep your eyes on the horizon, the world is full of surprises.',
        'A lost round is still a better story than staying home.',
        'Your team played bravely; HP is just one part of the journey.',
        'Sometimes the map wins, sometimes you win the lesson.',
        'You didn’t get lost; you just took the scenic route to the next round.',
        'The best navigators aren’t those who never get lost, but those who always find their way back.',
        'Even a wild guess puts you on the path to discovering somewhere incredible.',
        'The coordinates might have missed, but your team’s synergy was spot on.',
        'A missed border today is a landmark you’ll recognize instantly tomorrow.',
        'HP may fade, but the thrill of the hunt stays printed on the map.',
        'The world is too vast to fit into one perfect guess—keep exploring.',
        'No compass is perfect, but your instincts are getting sharper with every round.',
        'Every pixel of the map holds a secret; you’re just getting closer to cracking them all.',
        'Victory is a great destination, but the journey is where the real stories are written.',
        'A dropped pin in the wrong spot is just a landmark for your next great run.',
        'The globe is a massive puzzle, and your team just found another piece.',
        'You can\'t memorize the whole world, but you\'re sure giving it a good try.',
        'Even the most legendary cartographers started by getting a little lost.',
        'Your compass might be spinning, but your team\'s spirit is locked in.',
        'Every wrong turn is just an invitation to explore a new hemisphere.',
        'The horizon doesn\'t move, but you\'re definitely getting closer.',
        'Whether it\'s a vast desert or a crowded metropolis, every guess makes you a better guide.',
        'HP comes and goes, but the bragging rights of a perfect guess are forever.',
        'A blurry road sign today is a crystal-clear victory tomorrow.',
        'Not all who wander are lost—some are just calculating their next coordinates.',
        'The map is a canvas, and your team is painting a masterpiece of trial and error.',
        'If finding the spot was easy, it wouldn\'t be called an adventure.',
        'You missed the target, but you hit the bullseye of having a great story to tell.',
        'Every continent has its secrets; you\'re just doing the detective work.',
        'Your team’s synergy is the strongest navigation tool on this map.',
        'The coordinates might say one thing, but your determination says another.',
        'Keep your eyes on the dirt roads and the sun\'s angle—the clues are always there.',
        'Even a pixelated tree can point the way if you know how to look.',
        'You didn\'t lose HP; you just paid the price for an unforgettable scenic detour.',
        'The world is 197 million square miles. Missing by a few is basically a victory.',
        'A true explorer doesn\'t fear the edge of the map.',
        'The road ahead is long, but your team has plenty of fuel in the tank.',
        'Sometimes the best discoveries are made when you completely throw out the map.',
        'A little dust on your virtual boots just means you\'ve been going places.',
        'The stars don\'t change, but your ability to read them gets better every game.',
        'You aren\'t guessing in the dark; you\'re just shining a flashlight on a new corner of the earth.',
        'Every round is a new ticket to travel the world without leaving your seat.',
        'HP bar empty? Time to shake off the dust, reload the compass, and try a new hemisphere.',
        'Don\'t sweat the distance—even a thousand-mile miss is just a step toward a perfect pinpoint.',
        'A team that gets lost together, wins together in the next round.',
        'The world is a book, and your team just turned another page.',
        'You are building a mental map of the entire planet, one round at a time.',
        'A missed guess is just a bookmark in your global travel journal.'
    ];

    const randomEndPhrase = useMemo(
        () => endGamePhrases[Math.floor(Math.random() * endGamePhrases.length)],
        []
    );

    const teamsForOverlay = teams.length ? teams : game?.teams ?? [];
    const userTeam = user ? teamsForOverlay.find((t) => t.players.some((p) => p.firebase_uid === user.firebase_uid)) : undefined;
    const loserTeam = teamsForOverlay.find((t) => t.health === 0);
    const isUserWinner = !!userTeam && userTeam.health > 0 && loserTeam?.name !== userTeam.name;
    const endHeadline = userTeam ? (userTeam.health === 0 ? 'Defeat...' : 'Victory!') : 'Game Over';
    const endSubtext = userTeam
        ? userTeam.health === 0
            ? 'Your HP dropped to zero, but the next map is waiting.'
            : 'Your team survived the battle and earned the win.'
        : 'The match has ended — check the final team status.';

    const leaveGame = () => {
        navigate('/');
    };

    const newGame = () => {
        navigate('/multiplayer');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/95 p-4 sm:p-6 md:p-10 backdrop-blur-xl">
            <div className="relative my-auto flex w-full max-w-[1400px] flex-col overflow-hidden rounded-[32px] sm:rounded-[40px] border border-white/10 bg-[#08111d]/95 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_30%)] pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/10 to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col px-6 py-8 sm:px-10">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Game Over</p>
                                <h1 className="text-5xl font-black text-white sm:text-6xl animate-[pulse_2.2s_ease-in-out_infinite]">{endHeadline}</h1>
                                <p className="max-w-2xl text-lg leading-8 text-slate-300">{userTeam ? `Your team: ${userTeam.name}` : 'The match has finished — see how the teams performed below.'}</p>
                                <p className="text-sm text-slate-400">{endSubtext}</p>
                            </div>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 px-6 py-5 text-center shadow-xl min-w-[160px] lg:self-start">
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Multiplier</p>
                            <p className="mt-3 text-5xl font-black uppercase text-cyan-300">x{game?.multiplier || 1}</p>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-slate-500">Final score effect</p>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-5 lg:grid-cols-2">
                        {teamsForOverlay.map((team) => {
                            const isWinner = team.health > 0 && team !== loserTeam;
                            const connectedPlayers = team.players.filter((p) => p.is_connected);
                            const teamScore = scores ? team.players.reduce((acc, p) => acc + (scores[p.firebase_uid] ?? 0), 0) : (team.score || 0);
                            return (
                                <div
                                    key={team.name}
                                    className={`relative overflow-hidden rounded-[28px] border shadow-[0_28px_80px_rgba(15,23,42,0.35)] transition duration-500 hover:-translate-y-1 ${isWinner ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-emerald-600/10' : 'border-rose-400/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5'}`}>
                                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isWinner ? 'from-emerald-400 via-cyan-400 to-emerald-400' : 'from-rose-400 via-purple-400 to-rose-400'} opacity-60`} />
                                    
                                    <div className="relative z-10 border-b border-white/10 px-8 py-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Team</p>
                                                <p className="mt-2 text-3xl font-bold text-white">{team.name}</p>
                                            </div>
                                            <span className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.25em] flex items-center ${isWinner ? 'bg-emerald-500/30 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-rose-500/20 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'}`}>
                                                {isWinner ? <><Crown size={14} className="mr-2"/> Winner</> : <><XCircle size={14} className="mr-2"/> Loser</>}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex gap-6 border-b border-white/10 px-8 py-5">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">HP</p>
                                            <p className={`mt-1 text-2xl font-bold ${team.health > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{team.health}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Score</p>
                                            <p className="mt-1 text-2xl font-bold text-cyan-300">{teamScore}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Distance</p>
                                            <p className="mt-1 text-2xl font-bold text-purple-300">{Math.round(team.distance || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 px-8 py-6">
                                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-4">Players ({connectedPlayers.length}/{team.players.length})</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {team.players.map((player) => (
                                                <div
                                                    key={player.id}
                                                    className={`rounded-lg border px-3 py-3 transition ${
                                                        player.is_connected
                                                            ? isWinner
                                                                ? 'border-emerald-400/30 bg-emerald-500/10'
                                                                : 'border-slate-400/30 bg-slate-500/10'
                                                            : 'border-slate-600/30 bg-slate-900/30 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <span className="truncate text-sm font-semibold text-white">{player.username}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_0.9fr] items-stretch">
                        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-7 text-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.4)] flex flex-col justify-center">
                            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Match summary</p>
                            <p className="mt-4 text-lg leading-8 text-slate-100 animate-pulse">{randomEndPhrase}</p>
                        </div>

                        <div className="flex flex-col justify-center gap-4">
                            <button
                                onClick={newGame}
                                className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-black uppercase tracking-[0.15em] text-slate-950 transition duration-200 hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                New Game
                            </button>
                            <button
                                onClick={leaveGame}
                                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-[0.15em] text-slate-300 transition duration-200 hover:bg-white/10 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Go home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}