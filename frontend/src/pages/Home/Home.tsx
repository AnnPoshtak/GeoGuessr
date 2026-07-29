import { Dropdown } from '@/components/ControlPanel/ControlPanel';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { innerWidth, innerHeight } = window;
        mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
        mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const context = ctx;
        const W = canvas.width;
        const H = canvas.height;

        let animationFrameId: number;
        let globalOffset = 0;

        const x = (v: number) => v * W;
        const y = (v: number) => v * H;

        const ocean = context.createLinearGradient(0, 0, 0, H);
        ocean.addColorStop(0, '#5bc8f5');
        ocean.addColorStop(0.3, '#1e88e5');
        ocean.addColorStop(1, '#0a3d8f');

        const atm = context.createLinearGradient(0, 0, 0, H * 0.15);
        atm.addColorStop(0, 'rgba(255,255,255,0.5)');
        atm.addColorStop(1, 'rgba(255,255,255,0)');

        const gloss = context.createRadialGradient(W * 0.28, H * 0.08, 0, W * 0.45, H * 0.28, W * 0.65);
        gloss.addColorStop(0, 'rgba(255,255,255,0.25)');
        gloss.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        gloss.addColorStop(1, 'rgba(0,0,0,0)');

        function land(points: number[][], color = '#2d7a4f', shadow = '#1a5c35') {
            if (points.length < 2) return;

            context.beginPath();
            context.moveTo(points[0][0] + 4, points[0][1] + 4);
            for (let i = 1; i < points.length; i++) context.lineTo(points[i][0] + 4, points[i][1] + 4);
            context.closePath();
            context.fillStyle = shadow;
            context.fill();

            context.beginPath();
            context.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) context.lineTo(points[i][0], points[i][1]);
            context.closePath();
            context.fillStyle = color;
            context.fill();

            context.beginPath();
            context.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < Math.ceil(points.length * 0.4); i++) context.lineTo(points[i][0], points[i][1]);
            context.strokeStyle = 'rgba(255,255,255,0.2)';
            context.lineWidth = 1.5;
            context.stroke();
        }

        const drawAllIslands = () => {
            land([[x(0.05), y(0.12)], [x(0.18), y(0.10)], [x(0.24), y(0.15)], [x(0.20), y(0.24)], [x(0.26), y(0.32)], [x(0.15), y(0.38)], [x(0.10), y(0.30)], [x(0.14), y(0.22)], [x(0.04), y(0.20)]]);
            land([[x(0.38), y(0.06)], [x(0.48), y(0.04)], [x(0.56), y(0.09)], [x(0.58), y(0.18)], [x(0.48), y(0.22)], [x(0.44), y(0.14)], [x(0.35), y(0.15)]]);
            land([[x(0.68), y(0.14)], [x(0.78), y(0.08)], [x(0.92), y(0.10)], [x(0.96), y(0.24)], [x(0.85), y(0.35)], [x(0.74), y(0.30)], [x(0.76), y(0.22)], [x(0.66), y(0.24)]]);
            land([[x(0.32), y(0.38)], [x(0.45), y(0.35)], [x(0.52), y(0.44)], [x(0.55), y(0.54)], [x(0.42), y(0.62)], [x(0.34), y(0.56)], [x(0.36), y(0.46)], [x(0.26), y(0.44)]]);
            land([[x(0.03), y(0.48)], [x(0.15), y(0.50)], [x(0.24), y(0.58)], [x(0.18), y(0.72)], [x(0.06), y(0.76)], [x(0.04), y(0.62)]]);
            land([[x(0.64), y(0.46)], [x(0.78), y(0.42)], [x(0.88), y(0.48)], [x(0.90), y(0.64)], [x(0.80), y(0.74)], [x(0.66), y(0.68)], [x(0.64), y(0.56)]]);

            land([[x(0.28), y(0.06)], [x(0.31), y(0.05)], [x(0.29), y(0.09)]]);
            land([[x(0.33), y(0.10)], [x(0.35), y(0.08)], [x(0.34), y(0.12)]]);
            land([[x(0.62), y(0.07)], [x(0.64), y(0.06)], [x(0.63), y(0.10)]]);
            land([[x(0.25), y(0.27)], [x(0.27), y(0.26)], [x(0.26), y(0.30)]]);
            land([[x(0.49), y(0.28)], [x(0.51), y(0.27)], [x(0.50), y(0.32)]]);
            land([[x(0.58), y(0.34)], [x(0.60), y(0.33)], [x(0.59), y(0.37)]]);
            land([[x(0.61), y(0.40)], [x(0.63), y(0.39)], [x(0.62), y(0.43)]]);
            land([[x(0.07), y(0.36)], [x(0.09), y(0.35)], [x(0.08), y(0.39)]]);
            land([[x(0.83), y(0.18)], [x(0.85), y(0.17)], [x(0.84), y(0.21)]]);
            land([[x(0.92), y(0.36)], [x(0.94), y(0.35)], [x(0.93), y(0.40)]]);
            land([[x(0.25), y(0.64)], [x(0.28), y(0.63)], [x(0.26), y(0.67)]]);
            land([[x(0.29), y(0.70)], [x(0.31), y(0.69)], [x(0.30), y(0.73)]]);
            land([[x(0.55), y(0.66)], [x(0.57), y(0.65)], [x(0.56), y(0.69)]]);
            land([[x(0.51), y(0.74)], [x(0.53), y(0.73)], [x(0.52), y(0.77)]]);
            land([[x(0.75), y(0.78)], [x(0.77), y(0.77)], [x(0.76), y(0.81)]]);

            land([[x(0.00), y(0.90)], [x(0.18), y(0.88)], [x(0.35), y(0.91)], [x(0.55), y(0.87)], [x(0.75), y(0.90)], [x(1.00), y(0.87)], [x(1.00), y(1.00)], [x(0.00), y(1.00)]], '#c8e6c9', '#a5d6a7');
        };

        const render = () => {
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

            context.clearRect(0, 0, W, H);

            context.fillStyle = ocean;
            context.fillRect(0, 0, W, H);

            context.fillStyle = atm;
            context.fillRect(0, 0, W, H * 0.15);

            globalOffset -= 0.6;
            if (globalOffset <= -W) globalOffset = 0;

            const time = Date.now() * 0.001;
            const wobbleAngle = Math.sin(time) * 0.02;

            context.save();
            context.translate(W / 2 + mouseRef.current.x * 20, H / 2 + mouseRef.current.y * 20);
            context.rotate(wobbleAngle - 0.08);
            context.translate(-W / 2, -H / 2);

            context.save();
            context.translate(globalOffset, 0);
            drawAllIslands();
            context.translate(W, 0);
            drawAllIslands();
            context.restore();

            context.restore();

            context.fillStyle = gloss;
            context.fillRect(0, 0, W, H);

            context.save();
            context.translate(mouseRef.current.x * 10, mouseRef.current.y * 10);
            context.strokeStyle = 'rgba(255,255,255,0.07)';
            context.lineWidth = 0.8;
            for (let i = 0; i <= 12; i++) {
                const lx = (W / 12) * i;
                context.beginPath(); context.moveTo(lx, 0); context.lineTo(lx, H); context.stroke();
            }
            for (let i = 0; i <= 8; i++) {
                const ly = (H / 8) * i;
                context.beginPath(); context.moveTo(0, ly); context.lineTo(W, ly); context.stroke();
            }
            context.restore();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div 
            className="relative w-screen h-screen overflow-hidden app-shell flex flex-col items-center justify-between bg-[#080f1a] font-sans text-white"
            onMouseMove={handleMouseMove}
        >
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
                  radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.8) 0%, transparent 100%),
                  radial-gradient(1.5px 1.5px at 22% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(1px 1px at 65% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
                  radial-gradient(1px 1px at 80% 28%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(1px 1px at 45% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(1px 1px at 5% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
                  radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.5) 0%, transparent 100%)
                `
            }} />

            <header className="relative z-20 w-full flex flex-col items-center pt-6 sm:pt-8 md:pt-16 px-4 sm:px-6 text-center">
                <div className="absolute right-3 top-3 sm:right-4 sm:top-4 md:right-8 md:top-8">
                    <Dropdown />
                </div>

                <h1
                    className="text-3xl sm:text-5xl md:text-7xl font-black uppercase text-white select-none
                               tracking-[0.1em] sm:tracking-[0.22em]"
                    style={{ textShadow: '0 0 40px rgba(79,195,247,0.4), 0 2px 4px rgba(0,0,0,0.8)' }}
                >
                    GeoGuessr
                </h1>
                <div
                    className="w-12 md:w-16 h-[3px] bg-cyan-400 mx-auto mt-3 md:mt-4 rounded-full"
                    style={{ boxShadow: '0 0 14px #00e5ff' }}
                />
                <p className="mt-3 md:mt-4 text-gray-400 text-[10px] md:text-xs tracking-[0.15em] sm:tracking-[0.18em] uppercase font-medium max-w-xs opacity-75 select-none">
                    A geography game which takes you on a journey around the world.
                </p>
            </header>

            <div
                className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-full overflow-hidden z-10 transition-all duration-300
                           w-[220vw] h-[220vw] translate-y-[86%]
                           sm:w-[160vw] sm:h-[160vw] sm:translate-y-[82%]
                           md:w-[120vw] md:h-[120vw] md:translate-y-[76%]
                           lg:w-[90vw] lg:h-[90vw] lg:translate-y-[70%]"
                style={{
                    boxShadow: `
                        inset 0 30px 60px rgba(255,255,255,0.25),
                        inset 0 -20px 40px rgba(0,0,100,0.4),
                        0 0 80px rgba(0,200,255,0.35),
                        0 0 0 2px rgba(255,255,255,0.12)
                    `,
                }}
            >
                <div
                    className="absolute inset-0 rounded-full pointer-events-none z-20"
                    style={{
                        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)',
                    }}
                />

                <canvas
                    ref={canvasRef}
                    width={1400}
                    height={1400}
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'cover' }}
                />

                <div
                    className="absolute inset-0 rounded-full pointer-events-none z-20"
                    style={{
                        background: 'linear-gradient(170deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 35%)',
                    }}
                />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[15vh] bg-gradient-to-t from-[#080f1a]/80 to-transparent z-20 pointer-events-none" />

            <div className="relative z-30 bottom-6 sm:bottom-8 md:bottom-12 w-full max-w-[min(92vw,32rem)] px-3 sm:px-4 pb-4 sm:pb-6 flex flex-col items-center">
                <div className="w-full p-4 sm:p-6 rounded-2xl bg-[#080f1a]/60 border border-white/10 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-4">
                    <p 
                        className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-cyan-400 text-center select-none"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                    >
                        Choose game mode
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-150 hover:scale-[1.03] active:scale-[0.98]"
                            style={{
                                background: '#eef2f8',
                                color: '#0d47a1',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                            }}
                            onClick={() => navigate("/single-game")}
                        >
                            Single player
                        </button>
                        <button
                            className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-150 hover:scale-[1.03] active:scale-[0.98]"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.15)',
                            }}
                            onClick={() => navigate("/multiplayer")}
                        >
                            Multiplayer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}