import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import Music1 from "../public/sound/music1.mp3";
import Music2 from "../public/sound/music2.mp3";
import Music3 from "../public/sound/music3.mp3";
import Music4 from "../public/sound/music4.mp3";
import Music5 from "../public/sound/music5.mp3";
import Music6 from "../public/sound/music6.mp3";
import Music7 from "../public/sound/music7.mp3";

const PLAYLIST = [Music1, Music2, Music3, Music4, Music5, Music6, Music7];

export function useAudioPlayer(isPlaying: boolean, volume: number) {
    const location = useLocation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [currentTrack, setCurrentTrack] = useState(() => PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)]);

    const getTargetVolume = () => {
        const isInGame = location.pathname === "/single-game" || location.pathname === "/multiplayer-game";
        return isInGame ? volume * 0.15 : volume;
    };

    const fadeOutAndAction = (action: () => void) => {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (!audioRef.current || audioRef.current.paused) {
            action();
            return;
        }

        const startVolume = audioRef.current.volume;
        const fadeDuration = 800; 
        const intervalTime = 50;
        const steps = fadeDuration / intervalTime;
        const volumeStep = startVolume / steps;

        fadeIntervalRef.current = setInterval(() => {
            if (!audioRef.current) {
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                return;
            }

            if (audioRef.current.volume > volumeStep) {
                audioRef.current.volume -= volumeStep;
            } else {
                clearInterval(fadeIntervalRef.current!);
                action();
            }
        }, intervalTime);
    };

    useEffect(() => {
        audioRef.current = new Audio(currentTrack);
        
        const handleEnded = () => {
            const nextTrack = PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)];
            setCurrentTrack(nextTrack);
        };

        audioRef.current.addEventListener("ended", handleEnded);

        return () => {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener("ended", handleEnded);
            }
        };
    }, []);

    useEffect(() => {
        if (!audioRef.current) return;
        
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        audioRef.current.src = currentTrack;
        audioRef.current.volume = getTargetVolume();

        if (isPlaying) {
            audioRef.current.play().catch(() => console.log("Чекаємо на взаємодію..."));
        }
    }, [currentTrack]);

    useEffect(() => {
        if (!audioRef.current || fadeIntervalRef.current) return;
        audioRef.current.volume = getTargetVolume();
    }, [location.pathname, volume]);

    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            audioRef.current.volume = getTargetVolume();
            audioRef.current.play().catch(() => {});
        } else {
            fadeOutAndAction(() => {
                audioRef.current?.pause();
            });
        }
    }, [isPlaying]);

    useEffect(() => {
        const unlockAudio = () => {
            if (isPlaying && audioRef.current && audioRef.current.paused) {
                audioRef.current.volume = getTargetVolume();
                audioRef.current.play().catch(() => {});
            }
            window.removeEventListener("click", unlockAudio);
        };

        window.addEventListener("click", unlockAudio);
        return () => window.removeEventListener("click", unlockAudio);
    }, [isPlaying]);
}