import { CircleHelp } from "lucide-react";
import { Dropdown } from "@/components/ProfileButton/ProfileButton";
import { useNavigate } from "react-router-dom";
import VolumeControl from "../VolumeControl/VolumeControl";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

export const Header = () => {
    const navigate = useNavigate();
    
    return (
        <div className="w-full px-4 pt-4 sm:px-6 md:px-8 font-sans">
            <header className="bg-glass-bg backdrop-blur-md max-w-7xl mx-auto h-auto py-2.5 px-6 rounded-2xl shadow-sm border border-glass-border transition-all duration-300">
                <div className="flex flex-row items-center justify-between">
                    <h1 className="text-xl font-black uppercase tracking-[0.15em] text-dark select-none cursor-pointer transition-colors" onClick={() => navigate("/")}>
                        GeoGuessr
                    </h1>
                    
                    <div className="flex flex-row items-center gap-4 sm:gap-6">
                        <ThemeToggle />
                        <VolumeControl />
                        <Dropdown />
                    </div>
                </div>
            </header>
        </div>
    );
};