import { useEffect, type ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    children?: ReactNode; // Для кастомізації, якщо захочеш додати щось всередину
}

function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Підтвердити",
    cancelText = "Скасувати",
    children
}: ModalProps) {
    
    // Закриваємо модалку при натисканні Escape
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
        // Задній фон (Overlay) з легким розмиттям
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            
            {/* Сама плашка модалки */}
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 select-none">
                
                {/* Текстовий блок */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-neutral-100 tracking-wide">
                        {title}
                    </h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Додатковий контент (якщо буде передано через children) */}
                {children && <div className="py-2">{children}</div>}

                {/* Кнопки дій */}
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

export default Modal;