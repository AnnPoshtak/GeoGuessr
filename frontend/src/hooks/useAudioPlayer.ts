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
    const [currentTrack, setCurrentTrack] = useState(() => PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)]);

    useEffect(() => {
        audioRef.current = new Audio(currentTrack);
        
        const handleEnded = () => {
            const nextTrack = PLAYLIST[Math.floor(Math.random() * PLAYLIST.length)];
            setCurrentTrack(nextTrack);
        };

        audioRef.current.addEventListener("ended", handleEnded);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener("ended", handleEnded);
            }
        };
    }, []);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.src = currentTrack;
        if (isPlaying) {
            audioRef.current.play().catch(() => console.log("Чекаємо на взаємодію..."));
        }
    }, [currentTrack]);

    useEffect(() => {
        if (!audioRef.current) return;
        const isInGame = location.pathname === "/single-game" || location.pathname === "/multiplayer-game";
        audioRef.current.volume = isInGame ? volume * 0.15 : volume;
    }, [location.pathname, volume]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        const unlockAudio = () => {
            if (isPlaying && audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
            }
            window.removeEventListener("click", unlockAudio);
        };

        window.addEventListener("click", unlockAudio);
        return () => window.removeEventListener("click", unlockAudio);
    }, [isPlaying]);
}