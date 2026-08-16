import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent } from "react";
import { Leaf, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { MindmapNode } from "../types/mindmap";
import type { Theme } from "../constants/theme";
import { useTreeLayout } from "../lib/useTreeLayout";
import { findNode, wrapLabel } from "../lib/treeUtils";
import { CANVAS_H, CANVAS_W, NODE_H, NODE_W } from "../constants/theme";
import CanvasButton from "./CanvasButton";
import NodeSummary from "./NodeSummary";

interface MindmapCanvasProps {
    mindmap: MindmapNode;
    theme: Theme;
}

interface PopoverState {
    nodeId: string;
    x: number;
    y: number;
    containerW: number;
    containerH: number;
}

function nodeStyle(theme: Theme, depth: number, selected: boolean) {
    const isRoot = depth === 0;
    const fade = Math.max(0.35, 0.95 - depth * 0.22);
    return {
        fill: isRoot ? theme.ink : theme.canvasBg,
        text: isRoot ? theme.canvasBg : theme.ink,
        stroke: theme.ink,
        strokeOpacity: selected ? 1 : isRoot ? 1 : fade,
        strokeWidth: selected ? 2.5 : isRoot ? 2 : 1.4,
    };
}

export default function MindmapCanvas({ mindmap, theme }: MindmapCanvasProps) {
    const { nodes, links, fit } = useTreeLayout(mindmap);
    const nodeW = NODE_W * fit;
    const nodeH = NODE_H * fit;
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [popover, setPopover] = useState<PopoverState | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const drag = useRef<{ x: number; y: number; pan: { x: number; y: number }; moved: boolean } | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setPopover(null);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const onWheel = useCallback((e: WheelEvent) => {
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom((z) => Math.min(2.4, Math.max(0.45, z + delta)));
    }, []);

    const onMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            drag.current = { x: e.clientX, y: e.clientY, pan, moved: false };
        },
        [pan]
    );
    const onMouseMove = useCallback((e: ReactMouseEvent) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
        setPan({ x: drag.current.pan.x + dx, y: drag.current.pan.y + dy });
    }, []);
    const stopDrag = useCallback(() => {
        drag.current = null;
    }, []);

    function openPopover(e: ReactMouseEvent, nodeId: string) {
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPopover({
            nodeId,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            containerW: rect.width,
            containerH: rect.height,
        });
    }

    const groupTransform = `translate(${pan.x} ${pan.y}) translate(${CANVAS_W / 2} ${CANVAS_H / 2}) scale(${zoom}) translate(${-CANVAS_W / 2} ${-CANVAS_H / 2})`;

    const popoverNode = popover ? findNode(mindmap, popover.nodeId) : null;

    const cardW = 288;
    const cardH = 280;
    let left = 0;
    let top = 0;
    if (popover) {
        left = popover.x + 16;
        if (left + cardW > popover.containerW) left = popover.x - cardW - 16;
        left = Math.max(10, Math.min(left, popover.containerW - cardW - 10));

        top = popover.y - 10;
        top = Math.max(10, Math.min(top, popover.containerH - cardH - 10));
    }

    return (
        <div
            ref={containerRef}
            onClick={() => setPopover(null)}
            style={{
                position: "relative",
                height: 600,
                borderRadius: 20,
                overflow: "hidden",
                border: `1px solid ${theme.panelBorder}`,
                background: theme.canvasBg,
            }}
        >
            <svg
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                width="100%"
                height="100%"
                style={{ cursor: drag.current ? "grabbing" : "grab", display: "block" }}
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={stopDrag}
                onMouseLeave={stopDrag}
            >
                <g transform={groupTransform}>
                    {/* growth rings behind the trunk */}
                    <g opacity={0.08}>
                        {[46, 78, 112].map((r, i) => (
                            <circle
                                key={r}
                                cx={CANVAS_W / 2}
                                cy={CANVAS_H - 56}
                                r={r}
                                fill="none"
                                stroke={theme.ink}
                                strokeWidth={1}
                                className="ring-pulse"
                                style={{ animationDelay: `${i * 500}ms` }}
                            />
                        ))}
                    </g>

                    {/* branches */}
                    {links.map((l, i) => {
                        const midY = (l.source.y + l.target.y) / 2;
                        const path = `M ${l.source.x} ${l.source.y} C ${l.source.x} ${midY}, ${l.target.x} ${midY}, ${l.target.x} ${l.target.y}`;
                        const opacity = Math.max(0.2, 0.55 - l.depth * 0.14);
                        return (
                            <path
                                key={i}
                                d={path}
                                fill="none"
                                stroke={theme.ink}
                                strokeOpacity={opacity}
                                strokeLinecap="round"
                                strokeWidth={Math.max(1.3, 3.4 - l.depth * 0.9)}
                                pathLength={1}
                                className="branch-path"
                                style={{ animationDelay: `${l.depth * 160}ms` }}
                            />
                        );
                    })}

                    {/* nodes */}
                    {nodes.map((n, i) => {
                        const s = nodeStyle(theme, n.depth, popover?.nodeId === n.id);
                        const lines = wrapLabel(n.label, n.depth === 0 ? 17 : 15);
                        return (
                            <g
                                key={n.id}
                                className="tree-node"
                                transform={`translate(${n.pos.x} ${n.pos.y})`}
                                tabIndex={0}
                                role="button"
                                aria-label={n.label}
                                onClick={(e) => openPopover(e, n.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation();
                                        const rect = containerRef.current?.getBoundingClientRect();
                                        if (!rect) return;
                                        setPopover({ nodeId: n.id, x: n.pos.x, y: n.pos.y, containerW: rect.width, containerH: rect.height });
                                    }
                                }}
                            >
                                <g className="tree-node-enter" style={{ animationDelay: `${n.depth * 160 + i * 30}ms` }}>
                                    <rect
                                        className="node-rect"
                                        x={-nodeW / 2}
                                        y={-nodeH / 2}
                                        width={nodeW}
                                        height={nodeH}
                                        rx={(n.depth === 0 ? 30 : 14) * fit}
                                        fill={s.fill}
                                        stroke={s.stroke}
                                        strokeOpacity={s.strokeOpacity}
                                        strokeWidth={s.strokeWidth}
                                    />
                                    <text
                                        textAnchor="middle"
                                        fill={s.text}
                                        fillOpacity={n.depth === 0 ? 1 : Math.max(0.55, 0.95 - n.depth * 0.2)}
                                        fontFamily="'Inter', sans-serif"
                                        fontWeight={n.depth === 0 ? 700 : 500}
                                        fontSize={(n.depth === 0 ? 15 : 13) * fit}
                                        style={{ pointerEvents: "none" }}
                                    >
                                        {lines.map((line, li) => (
                                            <tspan key={li} x={0} y={(li - (lines.length - 1) / 2) * 16 * fit}>
                                                {line}
                                            </tspan>
                                        ))}
                                    </text>
                                    {n.isLeaf && n.depth > 0 && (
                                        <g
                                            transform={`translate(${nodeW / 2 - 14 * fit} ${-nodeH / 2 + 12 * fit}) scale(${fit})`}
                                            opacity={0.5}
                                        >
                                            <Leaf size={13} color={theme.ink} strokeWidth={2} />
                                        </g>
                                    )}
                                </g>
                            </g>
                        );
                    })}
                </g>
            </svg>

            <div
                style={{
                    position: "absolute",
                    left: 16,
                    bottom: 14,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    color: theme.muted,
                    opacity: 0.8,
                    pointerEvents: "none",
                }}
            >
                drag to pan · scroll to zoom · click a node
            </div>

            <div style={{ position: "absolute", right: 14, bottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <CanvasButton theme={theme} onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} label="Zoom in">
                    <ZoomIn size={15} />
                </CanvasButton>
                <CanvasButton theme={theme} onClick={() => setZoom((z) => Math.max(0.45, z - 0.2))} label="Zoom out">
                    <ZoomOut size={15} />
                </CanvasButton>
                <CanvasButton
                    theme={theme}
                    onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                    }}
                    label="Reset view"
                >
                    <RotateCcw size={14} />
                </CanvasButton>
            </div>

            {popover && popoverNode && (
                <NodeSummary
                    node={popoverNode}
                    isRoot={popover.nodeId === "root"}
                    theme={theme}
                    style={{ left, top, width: cardW }}
                    onClose={() => setPopover(null)}
                    onSelect={(id) => setPopover((p) => (p ? { ...p, nodeId: id } : p))}
                />
            )}
        </div>
    );
}