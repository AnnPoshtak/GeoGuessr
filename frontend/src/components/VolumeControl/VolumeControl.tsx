import { useState } from "react";
import { useMusic } from "../../context/MusicContext"; 
import { IoMdVolumeHigh, IoMdVolumeLow, IoMdVolumeMute, IoMdVolumeOff } from "react-icons/io";

export default function VolumeControl() {
  const { volume, setVolume, isPlaying, setIsPlaying } = useMusic();
  const [prevVolume, setPrevVolume] = useState(volume || 0.5);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && !isPlaying) {
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (isPlaying && volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      setIsPlaying(false);
    } else {
      setVolume(prevVolume);
      setIsPlaying(true);
    }
  };

  const getVolumeIcon = () => {
    if (!isPlaying || volume === 0) return <IoMdVolumeOff size={22} />;
    if (volume < 0.3) return <IoMdVolumeMute size={22} />;
    if (volume < 0.7) return <IoMdVolumeLow size={22} />;
    return <IoMdVolumeHigh size={22} />;
  };

  return (
    <div className="flex items-center gap-3 bg-[#0c1524]/80 border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg w-fit">
      <button
        onClick={toggleMute}
        className="text-neutral-300 hover:text-cyan-400 transition-colors duration-150 flex items-center justify-center"
      >
        {getVolumeIcon()}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isPlaying ? volume : 0}
        onChange={handleVolumeChange}
        className="w-28 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 transition-all outline-none"
        style={{
          background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(isPlaying ? volume : 0) * 100}%, #404040 ${(isPlaying ? volume : 0) * 100}%, #404040 100%)`
        }}
      />
    </div>
  );
}