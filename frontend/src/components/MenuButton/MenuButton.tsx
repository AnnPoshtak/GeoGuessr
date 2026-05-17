import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
}

function Modal({ isOpen, onClose, onConfirm, title, description, confirmText = "Підтвердити", cancelText = "Скасувати" }: ModalProps) {
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
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-neutral-100 tracking-wide">{title}</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
                </div>
                <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-sm cursor-pointer transition-colors duration-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-sm cursor-pointer transition-colors duration-200"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MenuButton() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); // Стан модалки

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isModalOpen) {
                setIsOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen]);

    return (
        <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 select-none">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-2xl flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-md"
                title="Меню (Esc)"
            >
                {isOpen ? "✕" : "☰"}
            </button>

            {isOpen && (
                <div className="w-60 bg-neutral-900 border border-neutral-800 rounded-xl p-2 flex flex-col gap-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="w-full text-left rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium p-3 cursor-pointer transition-colors duration-200"
                    >
                        Продовжити гру
                    </button>

                    <button 
                        onClick={() => setIsSoundOn(!isSoundOn)}
                        className="w-full text-left rounded-lg hover:bg-neutral-800/60 text-neutral-300 font-medium p-3 cursor-pointer transition-colors duration-200 flex justify-between items-center"
                    >
                        <span>Звукові ефекти</span>
                        <span className={`text-sm px-2 py-0.5 rounded ${isSoundOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                            {isSoundOn ? "Увімкнено" : "Вимкнено"}
                        </span>
                    </button>

                    <div className="h-[1px] bg-neutral-800 my-1 w-[90%] mx-auto" />

                    <button 
                        onClick={() => setIsModalOpen(true)} // Просто відкриваємо модалку підтвердження
                        className="w-full text-left rounded-lg hover:bg-red-950/30 text-neutral-400 hover:text-red-400 font-medium p-3 cursor-pointer transition-colors duration-200"
                    >
                        Головна сторінка
                    </button>
                    
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => {
                    setIsModalOpen(false);
                    navigate("/");
                }}
                title="Вийти з гри?"
                description="Ви впевнені, що хочете повернутися на головну сторінку? Поточний прогрес гри буде втрачено."
                confirmText="Так, вийти"
                cancelText="Залишитися"
            />
        </div>
    );
}

export default MenuButton;