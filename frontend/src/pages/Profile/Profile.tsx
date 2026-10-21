import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { useUser } from '@/context/UserContext';
import { SEO } from '@/SEO';
import { 
    User, 
    Mail, 
    Target, 
    Calendar, 
    LogOut, 
    Shield,
    Loader2,
    Award,
    Trophy,
    Gamepad2,
    Swords,
    Globe2
} from 'lucide-react';
import { toast } from 'sonner';

export interface UserStats {
    id: number;
    user_id: number;
    total_score: number;
    created_at: string;
    updated_at: string;
}

export interface UserProfileData {
    id: number;
    username: string;
    created_at: string;
    updated_at: string;
    stats?: UserStats;
}

export default function Profile() {
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState<boolean>(!user);

    // MOCKED DATA: Temporary fallback statistics and achievements until backend implementation
    const mockedGameStats = {
        singleplayerGames: 42,
        multiplayerGames: 18,
        bestSingleplayerScore: 24850,
        achievements: [
            { id: 1, title: 'Globe Trotter', desc: 'Played 50+ matches', icon: Globe2, unlocked: true },
            { id: 2, title: 'Sharpshooter', desc: 'Scored 24k+ in singleplayer', icon: Target, unlocked: true },
            { id: 3, title: 'Duel Master', desc: 'Won 10 multiplayer duels', icon: Swords, unlocked: true },
            { id: 4, title: 'Legendary Explorer', desc: 'Reach 100k total score', icon: Trophy, unlocked: false },
        ]
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/me/', {
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.status === 401) {
                    toast.error('Session expired. Please log in again.');
                    navigate('/');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to load profile');
                }

                const data: UserProfileData = await response.json();
                setUser(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate, setUser]);

    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            setUser(null);
            toast.success('Successfully logged out');
            navigate('/');
        } catch (err) {
            toast.error('Logout failed');
        }
    };

    if (loading) {
        return (
            <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans bg-cover bg-center bg-no-repeat bg-game-bg">
                <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-2xl gap-4 text-center">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <div className="text-xs font-black uppercase tracking-widest text-muted animate-pulse">
                        Loading profile data...
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const displayName = user.username.includes('@') 
        ? user.username.split('@')[0] 
        : user.username;

    const formattedJoinDate = user.created_at 
        ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Unknown';

    return (
        <>
            <SEO title={`${displayName}'s Profile`} description="View your player statistics and score in GeoGuessr." />

            <div className="relative w-screen min-h-screen overflow-x-hidden flex flex-col items-center justify-between font-sans selection:bg-primary/30 bg-cover bg-center bg-no-repeat transition-all duration-700 bg-game-bg">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 dark:from-black/20 dark:to-black/40 pointer-events-none z-0" />

                <div className="relative z-30 w-full">
                    <Header />
                </div>

                <main className="relative z-10 flex-1 w-full max-w-4xl px-6 py-8 flex flex-col gap-6 my-auto">
                    
                    <div className="w-full bg-glass-bg border border-glass-border rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                            
                            <div className="relative group">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-primary/30 bg-primary/10 flex items-center justify-center shadow-lg text-accent font-black text-4xl uppercase">
                                    {displayName.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-md border border-glass-border">
                                    <Shield className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl sm:text-3xl font-black text-dark uppercase tracking-tight">
                                    {displayName}
                                </h1>

                                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-muted">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{user.username}</span>
                                </div>

                                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-muted/70">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Joined {formattedJoinDate}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2 py-3 px-5 rounded-2xl bg-stat-missed/10 border border-stat-missed/20 text-stat-missed font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-stat-missed hover:text-white hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                            <span>Logout</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        
                        <div className="p-6 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-md flex flex-col justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                                <Target className="w-6 h-6" />
                            </div>
                            <div className="mt-4">
                                <span className="text-xs font-black text-muted uppercase tracking-wider block">
                                    Total Score
                                </span>
                                <span className="text-2xl font-black text-dark">
                                    {user.stats?.total_score ?? 0} <span className="text-xs font-bold text-muted">pts</span>
                                </span>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-md flex flex-col justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                                <Gamepad2 className="w-6 h-6" />
                            </div>
                            <div className="mt-4">
                                <span className="text-xs font-black text-muted uppercase tracking-wider block">
                                    Singleplayer
                                </span>
                                <span className="text-2xl font-black text-dark">
                                    {mockedGameStats.singleplayerGames} <span className="text-xs font-bold text-muted">matches</span>
                                </span>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-md flex flex-col justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                                <Swords className="w-6 h-6" />
                            </div>
                            <div className="mt-4">
                                <span className="text-xs font-black text-muted uppercase tracking-wider block">
                                    Multiplayer
                                </span>
                                <span className="text-2xl font-black text-dark">
                                   {mockedGameStats.multiplayerGames} <span className="text-xs font-bold text-muted">wins</span>
                                </span>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-md shadow-md flex flex-col justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-stat-correct/10 border border-stat-correct/20 text-stat-correct flex items-center justify-center">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div className="mt-4">
                                <span className="text-xs font-black text-muted uppercase tracking-wider block">
                                    Best Single Record
                                </span>
                                <span className="text-2xl font-black text-dark">
                                    {mockedGameStats.bestSingleplayerScore} <span className="text-xs font-bold text-muted">pts</span>
                                </span>
                            </div>
                        </div>

                    </div>

                    <div className="w-full bg-glass-bg border border-glass-border rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-md flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Award className="w-6 h-6 text-accent" />
                            <h2 className="text-xl font-black text-dark uppercase tracking-tight">
                                Achievements
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {mockedGameStats.achievements.map((ach) => {
                                const IconComponent = ach.icon;
                                return (
                                    <div 
                                        key={ach.id}
                                        className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                                            ach.unlocked 
                                                ? 'bg-primary/5 border-primary/20 text-dark' 
                                                : 'bg-glass-bg/40 border-glass-border opacity-50 text-muted'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                            ach.unlocked 
                                                ? 'bg-primary text-white shadow-md' 
                                                : 'bg-muted/20 text-muted'
                                        }`}>
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm uppercase tracking-wide">
                                                {ach.title}
                                            </h3>
                                            <p className="text-xs font-bold text-muted mt-0.5">
                                                {ach.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </main>
            </div>
        </>
    );
}