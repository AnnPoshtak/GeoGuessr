import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        const randomOffsetX = Math.random() * W;
        const randomAngle = (Math.random() * 16 - 8) * Math.PI / 180;

        const ocean = ctx.createLinearGradient(0, 0, 0, H);
        ocean.addColorStop(0, '#5bc8f5');
        ocean.addColorStop(0.3, '#1e88e5');
        ocean.addColorStop(1, '#0a3d8f');
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, W, H);

        const atm = ctx.createLinearGradient(0, 0, 0, H * 0.15);
        atm.addColorStop(0, 'rgba(255,255,255,0.5)');
        atm.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = atm;
        ctx.fillRect(0, 0, W, H * 0.15);

        function land(points, color = '#2d7a4f', shadow = '#1a5c35') {
            if (points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(points[0][0] + 4, points[0][1] + 4);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] + 4, points[i][1] + 4);
            ctx.closePath();
            ctx.fillStyle = shadow;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < Math.ceil(points.length * 0.4); i++) ctx.lineTo(points[i][0], points[i][1]);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        const x = (v) => v * W;
        const y = (v) => v * H;

        ctx.save(); 
        
        ctx.translate(randomOffsetX, 0); 
        ctx.translate(W / 2, H / 2);
        ctx.rotate(randomAngle);
        ctx.translate(-W / 2, -H / 2);

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

        drawAllIslands();

        ctx.translate(randomOffsetX > W / 2 ? -W : W, 0);
        drawAllIslands();

        ctx.restore(); 

        const gloss = ctx.createRadialGradient(W * 0.28, H * 0.08, 0, W * 0.45, H * 0.28, W * 0.65);
        gloss.addColorStop(0, 'rgba(255,255,255,0.25)');
        gloss.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        gloss.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gloss;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i <= 12; i++) {
            const lx = (W / 12) * i;
            ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
        }
        for (let i = 0; i <= 8; i++) {
            const ly = (H / 8) * i;
            ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
        }
    }, []);

    return (
        <div className="relative w-full h-screen flex flex-col items-center bg-[#080f1a] font-sans overflow-hidden text-white">
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
                  radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.8) 0%, transparent 100%),
                  radial-gradient(1.5px 1.5px at 22% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(1px 1px at 65% 8%, rgba(255,255,255,0.7) 0%, transparent 100%),
                  radial-gradient(1px 1px at 80% 28%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(1px 1px at 45% 18%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(1px 1px at 5% 75%, rgba(255,255,255,0.4) 0%, transparent 100%),
                  radial-gradient(1px 1px at 90% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(1px 1px at 55% 42%, rgba(255,255,255,0.3) 0%, transparent 100%),
                  radial-gradient(1px 1px at 35% 88%, rgba(255,255,255,0.4) 0%, transparent 100%),
                  radial-gradient(1px 1px at 72% 70%, rgba(255,255,255,0.35) 0%, transparent 100%)
                `
            }} />

            <header className="relative z-20 flex flex-col items-center pt-12 md:pt-16 px-4 text-center">
                <h1
                    className="text-5xl md:text-7xl font-black tracking-[0.22em] uppercase text-white"
                    style={{ textShadow: '0 0 40px rgba(79,195,247,0.4), 0 2px 4px rgba(0,0,0,0.8)' }}
                >
                    GeoGuessr
                </h1>
                <div
                    className="w-16 h-[3px] bg-cyan-400 mx-auto mt-4 rounded-full"
                    style={{ boxShadow: '0 0 14px #00e5ff' }}
                />
                <p className="mt-4 text-gray-400 text-[11px] md:text-xs tracking-[0.18em] uppercase font-medium max-w-xs opacity-75">
                    A geography game which takes you on a journey around the world.
                </p>
            </header>

            <div
                className="absolute z-10"
                style={{
                    width: '130vw',
                    height: '135vw',
                    bottom: '-105vw',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderRadius: '50%',
                    overflow: 'hidden',
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

            <div
                className="absolute z-30 flex flex-col items-center gap-3"
                style={{
                    bottom: '22%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    paddingInline: '1.5rem',
                }}
            >
                <p
                    className="text-xs font-bold tracking-[0.2em] uppercase text-white/80 mb-1"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
                >
                    Choose game mode
                </p>
                <div className="flex gap-4 w-full max-w-sm">
                    <button
                        className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
                        style={{
                            background: '#eef2f8',
                            color: '#0d47a1',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                        }}
                        onClick={() => navigate("/single-game")}
                    >
                        Single player
                    </button>
                    <button
                        className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
                        style={{
                            background: 'rgba(8,15,26,0.85)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.18)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                            backdropFilter: 'blur(4px)',
                        }}
                        onClick={() => navigate("/multiplayer")}
                    >
                        Multiplayer
                    </button>
                </div>
            </div>
        </div>
    );
}