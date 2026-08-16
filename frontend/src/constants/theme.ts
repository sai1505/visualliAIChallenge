export interface Theme {
    mode: "dark" | "light";
    bg: string; // page background
    canvasBg: string; // tree canvas background
    ink: string; // primary foreground (white in dark mode, black in light mode)
    muted: string;
    line: string; // branch stroke colour (rgba of `ink`)
    panelBg: string; // popover / input card background (inverted relative to bg)
    panelText: string;
    panelBorder: string;
    chipBg: string;
}

// Two colours only: black and white, swapped between modes.
export const darkTheme: Theme = {
    mode: "dark",
    bg: "#0a0a0a",
    canvasBg: "#000000",
    ink: "#ffffff",
    muted: "#9a9a9a",
    line: "rgba(255,255,255,0.4)",
    panelBg: "#ffffff",
    panelText: "#0a0a0a",
    panelBorder: "#e4e4e4",
    chipBg: "#f2f2f2",
};

export const lightTheme: Theme = {
    mode: "light",
    bg: "#ffffff",
    canvasBg: "#fafafa",
    ink: "#0a0a0a",
    muted: "#6a6a6a",
    line: "rgba(0,0,0,0.4)",
    panelBg: "#0a0a0a",
    panelText: "#ffffff",
    panelBorder: "#242424",
    chipBg: "#1a1a1a",
};

// canvas geometry, shared between the layout hook and the renderer
export const CANVAS_W = 1100;
export const CANVAS_H = 640;
export const NODE_W = 172;
export const NODE_H = 60;