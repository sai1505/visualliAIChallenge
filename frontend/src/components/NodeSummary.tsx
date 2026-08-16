import type { CSSProperties } from "react";
import { X } from "lucide-react";
import type { Theme } from "../constants/theme";
import type { TreeNode } from "../lib/mindmapToTree";

interface NodeSummaryProps {
    node: TreeNode;
    isRoot: boolean;
    theme: Theme;
    style: CSSProperties;
    onClose: () => void;
    onSelect: (id: string) => void;
}

function nodeKind(node: TreeNode, isRoot: boolean): string {
    if (isRoot) {
        return "Root";
    }

    if (node.children.length === 0) {
        return "Leaf";
    }

    return "Branch";
}

export default function NodeSummary({
    node,
    isRoot,
    theme,
    style,
    onClose,
    onSelect,
}: NodeSummaryProps) {
    const kind = nodeKind(node, isRoot);

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="node-popover absolute z-20 w-[288px] rounded-2xl border px-[18px] py-4"
            style={{
                backgroundColor: theme.panelBg,
                color: theme.panelText,
                borderColor: theme.panelBorder,
                boxShadow:
                    theme.mode === "dark"
                        ? "0 24px 48px rgba(0,0,0,0.55)"
                        : "0 24px 48px rgba(0,0,0,0.18)",
                ...style,
            }}
        >
            {/* Header */}

            <div className="flex items-start justify-between gap-2.5">
                <span className="text-[10.5px] uppercase tracking-[0.1em] opacity-50">
                    {kind}
                </span>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="m-[-4px_-4px_0_0] cursor-pointer border-none bg-transparent p-0.5 leading-none opacity-55 transition-opacity hover:opacity-100"
                    style={{
                        color: theme.panelText,
                    }}
                >
                    <X size={15} />
                </button>
            </div>

            {/* Title */}

            <h3 className="m-0 mt-2 text-[17px] font-bold leading-[1.3]">
                {node.label}
            </h3>

            {/* Summary */}

            <p className="mt-2.5 text-[13.5px] leading-[1.6] opacity-80">
                {node.summary}
            </p>

            {/* Children */}

            {node.children.length > 0 && (
                <div className="mt-3.5">
                    <p className="mb-1.5 text-[10px] uppercase tracking-[0.08em] opacity-50">
                        Grows into
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                        {node.children.map((child) => (
                            <button
                                key={child.id}
                                type="button"
                                onClick={() => onSelect(child.id)}
                                className="cursor-pointer rounded-full border px-[9px] py-1 text-[11.5px] transition-all duration-150 hover:scale-[1.03]"
                                style={{
                                    backgroundColor: theme.chipBg,
                                    color: theme.panelText,
                                    borderColor: theme.panelBorder,
                                }}
                            >
                                {child.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Node ID */}

            <div
                className="mt-3.5 border-t pt-2.5 text-[10.5px] opacity-45"
                style={{
                    borderColor: theme.panelBorder,
                }}
            >
                {node.id}
            </div>
        </div>
    );
}
