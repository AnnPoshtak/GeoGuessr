import { useEffect, useRef } from 'react';

interface Confetto {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    scale: number;
    opacity: number;
    width: number;
    height: number;
    color: string;
}

interface ConfettiProps {
    isActive: boolean;
    duration?: number;
}

export function Confetti({ isActive, duration = 2000 }: ConfettiProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isActive || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const colors = ['#10b981', '#34d399', '#6ee7b7', '#d1fae5', '#fbbf24', '#f59e0b'];
        const confetti: Confetto[] = [];

        const pieceCount = 50;
        for (let i = 0; i < pieceCount; i++) {
            confetti.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 8 - 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                scale: Math.random() * 0.8 + 0.5,
                opacity: 1,
                width: 8,
                height: 8,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        let startTime = Date.now();
        const gravity = 0.15;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confetti.forEach(c => {
                c.vy += gravity;
                c.x += c.vx;
                c.y += c.vy;
                c.rotation += c.rotationSpeed;
                c.opacity = Math.max(0, 1 - Math.pow(progress, 0.5));

                ctx.save();
                ctx.globalAlpha = c.opacity;
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation);
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
                ctx.restore();
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }, [isActive, duration]);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-40"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
