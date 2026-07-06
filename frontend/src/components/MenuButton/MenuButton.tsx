import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "@/context/GameContext";
import ScoreBoard from "../Resuts/Results"; 

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <h2 className="text-xl font-bold text-neutral-100 tracking-wide">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-100 text-lg cursor-pointer transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div className="w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}

function MenuButton() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const { 
        isSoundOn, 
        setIsSoundOn, 
        score, 
        totalGuesses, 
        correctGuesses, 
        closeGuesses, 
        notGuesses 
    } = useGameContext();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isExitModalOpen && !isMapModalOpen) {
                setIsOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isExitModalOpen, isMapModalOpen]);

    return (
        <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 select-none">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-2xl flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-md"
                title="Menu (Esc)"
            >
                {isOpen ? "✕" : "☰"}
            </button>

            {isOpen && (
                <div className="w-[min(85vw,15rem)] bg-neutral-900 border border-neutral-800 rounded-xl p-2 flex flex-col gap-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            setIsMapModalOpen(true);
                        }}
                        className="w-full text-left rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium p-3 cursor-pointer transition-colors duration-200"
                    >
                        Open Score Board
                    </button>

                    <button 
                        onClick={() => setIsSoundOn(!isSoundOn)}
                        className="w-full text-left rounded-lg hover:bg-neutral-800/60 text-neutral-300 font-medium p-3 cursor-pointer transition-colors duration-200 flex justify-between items-center"
                    >
                        <span>Sound Effects</span>
                        <span className={`text-sm px-2 py-0.5 rounded ${isSoundOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                            {isSoundOn ? "On" : "Off"}
                        </span>
                    </button>

                    <div className="h-[1px] bg-neutral-800 my-1 w-[90%] mx-auto" />

                    <button 
                        onClick={() => setIsExitModalOpen(true)}
                        className="w-full text-left rounded-lg hover:bg-red-950/30 text-neutral-400 hover:text-red-400 font-medium p-3 cursor-pointer transition-colors duration-200"
                    >
                        Main Menu
                    </button>
                    
                </div>
            )}

            <Modal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                title="Game Statistics"
            >
                <div className="w-full">
                    <ScoreBoard 
                        score={score} 
                        totalGuesses={totalGuesses} 
                        correctGuesses={correctGuesses} 
                        closeGuesses={closeGuesses} 
                        missedGuesses={notGuesses} 
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                title="Exit Game?"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-400 leading-relaxed">
                        Are you sure you want to return to the main menu? Your current game progress will be lost.
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-2">
                        <button
                            onClick={() => setIsExitModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm cursor-pointer transition-colors duration-200"
                        >
                            Stay
                        </button>
                        <button
                            onClick={() => {
                                setIsExitModalOpen(false);
                                navigate("/");
                            }}
                            className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-sm cursor-pointer transition-colors duration-200"
                        >
                            Yes, Exit
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default MenuButton;