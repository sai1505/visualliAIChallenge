import { useMemo } from "react";
import * as d3 from "d3";
import type { MindmapNode } from "../types/mindmap";
import { CANVAS_H, CANVAS_W, NODE_H, NODE_W } from "../constants/theme";

export interface LayoutNode {
    id: string;
    label: string;
    depth: number;
    isLeaf: boolean;
    pos: { x: number; y: number };
}

export interface LayoutLink {
    source: { x: number; y: number };
    target: { x: number; y: number };
    depth: number;
}

const PAD = 56;

export function useTreeLayout(tree: MindmapNode) {
    return useMemo(() => {
        const root = d3.hierarchy<MindmapNode>(tree, (d) => d.children);
        const layout = d3
            .tree<MindmapNode>()
            .nodeSize([200, 150])
            .separation((a, b) => (a.parent === b.parent ? 1.05 : 1.5));
        const positioned = layout(root);

        const allNodes = positioned.descendants();

        // Bounding box of the actual node RECTS (not just their centers),
        // so the fit scale below guarantees nothing gets clipped —
        // no artificial floor on the scale.
        const minX = Math.min(...allNodes.map((d) => d.x)) - NODE_W / 2;
        const maxX = Math.max(...allNodes.map((d) => d.x)) + NODE_W / 2;
        const minY = -NODE_H / 2;
        const maxY = Math.max(...allNodes.map((d) => d.y)) + NODE_H / 2;

        const contentW = maxX - minX;
        const contentH = maxY - minY;

        const fit = Math.min(
            (CANVAS_W - PAD * 2) / contentW,
            (CANVAS_H - PAD * 2) / contentH,
            1.15
        );

        const xCenter = (minX + maxX) / 2;

        const place = (d: d3.HierarchyPointNode<MindmapNode>) => ({
            x: CANVAS_W / 2 + (d.x - xCenter) * fit,
            y: CANVAS_H - PAD - d.y * fit, // root (y=0) near the bottom
        });

        const posById: Record<string, { x: number; y: number }> = {};
        allNodes.forEach((d) => {
            posById[d.data.id] = place(d);
        });

        const nodes: LayoutNode[] = allNodes.map((d) => ({
            id: d.data.id,
            label: d.data.label,
            depth: d.depth,
            isLeaf: !d.children,
            pos: posById[d.data.id],
        }));

        const links: LayoutLink[] = positioned.links().map((l) => ({
            source: posById[l.source.data.id],
            target: posById[l.target.data.id],
            depth: l.target.depth,
        }));

        return { nodes, links, fit };
    }, [tree]);
}