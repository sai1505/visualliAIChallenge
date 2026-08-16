import type { CSSProperties } from "react";
import { X } from "lucide-react";
import type { MindmapNode } from "../types/mindmap";
import { nodeKind } from "../types/mindmap";
import type { Theme } from "../constants/theme";

interface NodeSummaryProps {
    node: MindmapNode;
    isRoot: boolean;
    theme: Theme;
    style: CSSProperties;
    onClose: () => void;
    onSelect: (id: string) => void;
}

export default function NodeSummary({ node, isRoot, theme, style, onClose, onSelect }: NodeSummaryProps) {
    const kind = nodeKind(node, isRoot);

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="node-popover"
            style={{
                position: "absolute",
                background: theme.panelBg,
                color: theme.panelText,
                border: `1px solid ${theme.panelBorder}`,
                borderRadius: 16,
                padding: "16px 18px 16px",
                boxShadow: theme.mode === "dark" ? "0 24px 48px rgba(0,0,0,0.55)" : "0 24px 48px rgba(0,0,0,0.18)",
                zIndex: 20,
                ...style,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }}>
                    {kind}
                </span>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        opacity: 0.55,
                        lineHeight: 1,
                        padding: 2,
                        margin: "-4px -4px 0 0",
                    }}
                >
                    <X size={15} />
                </button>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: 17, margin: "8px 0 0", lineHeight: 1.3 }}>{node.label}</h3>

            <p style={{ marginTop: 10, lineHeight: 1.6, fontSize: 13.5, opacity: 0.8 }}>{node.summary}</p>

            {node.children.length > 0 && (
                <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, marginBottom: 6 }}>
                        Grows into
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {node.children.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => onSelect(c.id)}
                                style={{
                                    fontSize: 11.5,
                                    padding: "4px 9px",
                                    borderRadius: 999,
                                    background: theme.chipBg,
                                    color: theme.panelText,
                                    border: `1px solid ${theme.panelBorder}`,
                                    cursor: "pointer",
                                }}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${theme.panelBorder}`, fontSize: 10.5, opacity: 0.45 }}>
                {node.id}
            </div>
        </div>
    );
}