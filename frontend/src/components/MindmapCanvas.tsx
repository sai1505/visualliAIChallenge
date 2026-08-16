import { useCallback, useEffect, useRef, useState } from "react";

import type { MouseEvent as ReactMouseEvent, WheelEvent } from "react";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import type { Mindmap, MindmapNode } from "../types/mindmap";

import type { Theme } from "../constants/theme";

import { useTreeLayout } from "../lib/useTreeLayout";

import { mindmapToTree, type TreeNode } from "../lib/mindmapToTree";

import { wrapLabel } from "../lib/treeUtils";

import { CANVAS_H, CANVAS_W, NODE_H, NODE_W } from "../constants/theme";

import CanvasButton from "./CanvasButton";

interface MindmapCanvasProps {
  mindmap: Mindmap;
  theme: Theme;
  selectedNode: MindmapNode | null;
  onNodeSelect: (node: MindmapNode | null) => void;
}

/* ---------------------------------- */
/* Node styling */
/* ---------------------------------- */

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

/* ---------------------------------- */
/* Find node */
/* ---------------------------------- */

function findTreeNode(root: TreeNode | null, id: string): TreeNode | null {
  if (!root) {
    return null;
  }

  if (root.id === id) {
    return root;
  }

  for (const child of root.children) {
    const result = findTreeNode(child, id);

    if (result) {
      return result;
    }
  }

  return null;
}

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */

export default function MindmapCanvas({
  mindmap,
  theme,
  selectedNode,
  onNodeSelect,
}: MindmapCanvasProps) {
  const tree = mindmapToTree(mindmap);

  const [zoom, setZoom] = useState(1);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  const drag = useRef<{
    x: number;
    y: number;

    pan: {
      x: number;
      y: number;
    };

    moved: boolean;
  } | null>(null);

  /* ---------------------------------- */
  /* Keyboard */
  /* ---------------------------------- */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onNodeSelect(null);
      }
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onNodeSelect]);

  /* ---------------------------------- */
  /* Zoom */
  /* ---------------------------------- */

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.08 : 0.08;

    setZoom((z) => Math.min(2.4, Math.max(0.45, z + delta)));
  }, []);

  /* ---------------------------------- */
  /* Drag / Pan */
  /* ---------------------------------- */

  const onMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      drag.current = {
        x: e.clientX,
        y: e.clientY,

        pan,

        moved: false,
      };
    },
    [pan],
  );

  const onMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!drag.current) {
      return;
    }

    const dx = e.clientX - drag.current.x;

    const dy = e.clientY - drag.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.current.moved = true;
    }

    setPan({
      x: drag.current.pan.x + dx,

      y: drag.current.pan.y + dy,
    });
  }, []);

  const stopDrag = useCallback(() => {
    drag.current = null;
  }, []);

  /* ---------------------------------- */
  /* Node click */
  /* ---------------------------------- */

  function handleNodeClick(e: ReactMouseEvent, nodeId: string) {
    e.stopPropagation();

    /*
     * Don't select a node when
     * the user was actually dragging
     * the diagram.
     */
    if (drag.current?.moved) {
      return;
    }

    const node = findTreeNode(tree, nodeId);

    if (!node) {
      return;
    }

    /*
     * Clicking the selected node
     * again closes the panel.
     */
    if (selectedNode?.id === node.id) {
      onNodeSelect(null);
      return;
    }

    onNodeSelect(node);
  }

  /* ---------------------------------- */
  /* Empty / invalid tree */
  /* ---------------------------------- */

  if (!tree) {
    return (
      <div
        className="
                    flex
                    h-[600px]
                    items-center
                    justify-center
                    rounded-[20px]
                    border
                "
        style={{
          borderColor: theme.panelBorder,

          backgroundColor: theme.canvasBg,

          color: theme.muted,
        }}
      >
        Unable to build mindmap layout.
      </div>
    );
  }

  /* ---------------------------------- */
  /* Layout */
  /* ---------------------------------- */

  const { nodes, links } = useTreeLayout(tree);

  /*
   * The layout already returns
   * positions fitted to the canvas.
   */
  const fit = 1;

  const nodeW = NODE_W * fit;

  const nodeH = NODE_H * fit;

  /* ---------------------------------- */
  /* SVG transform */
  /* ---------------------------------- */

  const groupTransform =
    `translate(${pan.x} ${pan.y}) ` +
    `translate(${CANVAS_W / 2} ${CANVAS_H / 2}) ` +
    `scale(${zoom}) ` +
    `translate(${-CANVAS_W / 2} ${-CANVAS_H / 2})`;

  /* ---------------------------------- */
  /* Render */
  /* ---------------------------------- */

  return (
    <div
      ref={containerRef}
      onClick={() => onNodeSelect(null)}
      className="
                relative
                h-[600px]
                overflow-hidden
                rounded-[20px]
                border
            "
      style={{
        borderColor: theme.panelBorder,

        backgroundColor: theme.canvasBg,
      }}
    >
      {/* SVG */}

      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="
                    block
                    h-full
                    w-full
                    select-none
                "
        style={{
          cursor: drag.current ? "grabbing" : "grab",
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <g transform={groupTransform}>
          {/* ----------------------------- */}
          {/* Growth rings */}
          {/* ----------------------------- */}

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
                style={{
                  animationDelay: `${i * 500}ms`,
                }}
              />
            ))}
          </g>

          {/* ----------------------------- */}
          {/* Branches */}
          {/* ----------------------------- */}

          {links.map((l, i) => {
            const midY = (l.source.y + l.target.y) / 2;

            const path =
              `M ${l.source.x} ${l.source.y} ` +
              `C ${l.source.x} ${midY}, ` +
              `${l.target.x} ${midY}, ` +
              `${l.target.x} ${l.target.y}`;

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
                style={{
                  animationDelay: `${l.depth * 160}ms`,
                }}
              />
            );
          })}

          {/* ----------------------------- */}
          {/* Nodes */}
          {/* ----------------------------- */}

          {nodes.map((n, i) => {
            const isSelected = selectedNode?.id === n.id;

            const s = nodeStyle(theme, n.depth, isSelected);

            const lines = wrapLabel(n.label, n.depth === 0 ? 17 : 15);

            return (
              <g
                key={n.id}
                className="
                                        tree-node
                                        cursor-pointer
                                    "
                transform={`translate(${n.pos.x} ${n.pos.y})`}
                tabIndex={0}
                role="button"
                aria-label={n.label}
                onClick={(e) => handleNodeClick(e, n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();

                    const node = findTreeNode(tree, n.id);

                    if (node) {
                      if (selectedNode?.id === node.id) {
                        onNodeSelect(null);
                      } else {
                        onNodeSelect(node);
                      }
                    }
                  }
                }}
              >
                <g
                  className="tree-node-enter"
                  style={{
                    animationDelay: `${n.depth * 160 + i * 30}ms`,
                  }}
                >
                  {/* Node rectangle */}

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

                  {/* Node text */}

                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={s.text}
                    fillOpacity={
                      n.depth === 0 ? 1 : Math.max(0.55, 0.95 - n.depth * 0.2)
                    }
                    fontFamily="'Inter', sans-serif"
                    fontWeight={n.depth === 0 ? 700 : 500}
                    fontSize={(n.depth === 0 ? 15 : 13) * fit}
                    style={{
                      pointerEvents: "none",
                    }}
                  >
                    {lines.map((line, li) => (
                      <tspan
                        key={li}
                        x={0}
                        dy={
                          li === 0
                            ? `${-((lines.length - 1) * 8) * fit}px`
                            : `${16 * fit}px`
                        }
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ----------------------------- */}
      {/* Help text */}
      {/* ----------------------------- */}

      <div
        className="
                    pointer-events-none
                    absolute
                    bottom-[14px]
                    left-4
                    text-[11px]
                    tracking-[0.04em]
                    opacity-80
                "
      >
        <span
          style={{
            color: theme.muted,
          }}
        >
          drag to pan · scroll to zoom · click a node
        </span>
      </div>

      {/* ----------------------------- */}
      {/* Controls */}
      {/* ----------------------------- */}

      <div
        className="
                    absolute
                    bottom-[14px]
                    right-[14px]
                    flex
                    flex-col
                    gap-2
                "
      >
        <CanvasButton
          theme={theme}
          onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))}
          label="Zoom in"
        >
          <ZoomIn size={15} />
        </CanvasButton>

        <CanvasButton
          theme={theme}
          onClick={() => setZoom((z) => Math.max(0.45, z - 0.2))}
          label="Zoom out"
        >
          <ZoomOut size={15} />
        </CanvasButton>

        <CanvasButton
          theme={theme}
          onClick={() => {
            setZoom(1);

            setPan({
              x: 0,
              y: 0,
            });

            onNodeSelect(null);
          }}
          label="Reset view"
        >
          <RotateCcw size={14} />
        </CanvasButton>
      </div>
    </div>
  );
}
