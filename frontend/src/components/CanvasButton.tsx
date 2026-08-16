import type { ReactNode } from "react";
import type { Theme } from "../constants/theme";
import SpecularButton from "./SpecularButton";

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
        <SpecularButton
            size="sm"
            radius={10}
            tint={theme.panelText}
            tintOpacity={0}
            blur={0}
            textColor={theme.panelBg}
            lineColor={theme.panelBorder}
            baseColor={theme.panelBg}
            intensity={1}
            shineSize={10}
            shineFade={40}
            thickness={1}
            speed={0.35}
            followMouse
            proximity={250}
            autoAnimate={true}
            onClick={onClick}
            aria-label={label}
        >
            {children}
        </SpecularButton>
    );
}