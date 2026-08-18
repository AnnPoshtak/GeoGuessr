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
    } else if (newVolume === 0 && isPlaying) {
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      setIsPlaying(false);
    } else {
      const restoreVolume = prevVolume > 0 ? prevVolume : 0.5;
      setVolume(restoreVolume);
      setIsPlaying(true);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <IoMdVolumeOff size={20} />;
    if (volume < 0.3) return <IoMdVolumeMute size={20} />;
    if (volume < 0.7) return <IoMdVolumeLow size={20} />;
    return <IoMdVolumeHigh size={20} />;
  };

  return (
    <div className="group/volume flex items-center gap-2 py-1.5 px-3 bg-glass-bg backdrop-blur-md rounded-full border border-glass-border shadow-sm font-sans select-none transition-all duration-300">
      
      <button
        onClick={toggleMute}
        className="text-muted hover:text-primary transition-colors duration-150 flex items-center justify-center"
      >
        {getVolumeIcon()}
      </button>

      <div className="w-0 opacity-0 max-w-0 overflow-hidden group-hover/volume:w-24 group-hover/volume:max-w-[96px] group-hover/volume:opacity-100 group-hover/volume:overflow-visible transition-all duration-300 ease-out flex items-center h-5"> 
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full h-[4px] rounded-full appearance-none cursor-pointer outline-none transition-all
            [&::-webkit-slider-runnable-track]:h-[4px]
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-gradient-to-r
            [&::-webkit-slider-runnable-track]:from-primary
            [&::-webkit-slider-runnable-track]:to-glass-border
            
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:h-3.5 
            [&::-webkit-slider-thumb]:w-3.5 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-primary 
            [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-neutral-900
            [&::-webkit-slider-thumb]:shadow-md 
            [&::-webkit-slider-thumb]:transition-transform 
            [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:-mt-[5px]
            
            [&::-moz-range-track]:h-[4px]
            [&::-moz-range-track]:rounded-full
            
            [&::-moz-range-thumb]:h-3.5 
            [&::-moz-range-thumb]:w-3.5 
            [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-primary 
            [&::-moz-range-thumb]:border-2 
            [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-neutral-900
            [&::-moz-range-thumb]:shadow-md 
            [&::-moz-range-thumb]:transition-transform 
            [&::-moz-range-thumb]:duration-200
            [&::-moz-range-border]:border-none

            group-hover/volume:[&::-webkit-slider-thumb]:scale-110
            group-hover/volume:[&::-moz-range-thumb]:scale-110
            hover:[&::-webkit-slider-thumb]:scale-125!
            hover:[&::-moz-range-thumb]:scale-125!"
          style={{
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${volume * 100}%, var(--color-glass-border) ${volume * 100}%, var(--color-glass-border) 100%)`
          }}
        />
      </div>
    </div>
  );
}