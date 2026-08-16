import type { ReactNode } from "react";
import type { Theme } from "../constants/theme";

interface CanvasButtonProps {
    onClick: () => void;
    label: string;
    theme: Theme;
    children: ReactNode;
}

export default function CanvasButton({ onClick, label, theme, children }: CanvasButtonProps) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: theme.panelBg,
                color: theme.panelText,
                border: `1px solid ${theme.panelBorder}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    );
}