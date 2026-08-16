import type { ReactNode } from "react";
import type { Theme } from "../constants/theme";

interface CanvasButtonProps {
    onClick: () => void;
    label: string;
    theme: Theme;
    children: ReactNode;
}

export default function CanvasButton({
    onClick,
    label,
    theme,
    children,
}: CanvasButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="
                flex
                h-[34px]
                w-[34px]
                items-center
                justify-center
                rounded-[10px]
                border
                shadow-[0_2px_6px_rgba(0,0,0,0.3)]
                transition-transform
                duration-150
                hover:scale-105
                active:scale-95
            "
            style={{
                backgroundColor: theme.panelBg,
                color: theme.panelText,
                borderColor: theme.panelBorder,
            }}
        >
            {children}
        </button>
    );
}