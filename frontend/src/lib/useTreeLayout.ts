import { useMemo } from "react";
import * as d3 from "d3";

import type { TreeNode } from "./mindmapToTree";

import {
    CANVAS_H,
    CANVAS_W,
    NODE_H,
    NODE_W,
} from "../constants/theme";

export interface LayoutNode {
    id: string;
    label: string;
    depth: number;
    isLeaf: boolean;
    pos: {
        x: number;
        y: number;
    };
}

export interface LayoutLink {
    source: {
        x: number;
        y: number;
    };
    target: {
        x: number;
        y: number;
    };
    depth: number;
}

const PAD = 56;

export function useTreeLayout(
    tree: TreeNode
) {
    return useMemo(() => {
        const root = d3.hierarchy<TreeNode>(
            tree,
            (d) => d.children
        );

        const layout = d3
            .tree<TreeNode>()
            .nodeSize([200, 150])
            .separation((a, b) =>
                a.parent === b.parent
                    ? 1.05
                    : 1.5
            );

        layout(root);

        const allNodes =
            root.descendants() as d3.HierarchyPointNode<TreeNode>[];

        if (allNodes.length === 0) {
            return {
                nodes: [],
                links: [],
                fit: 1,
            };
        }

        const xValues = allNodes.map(
            (d) => d.x
        );

        const yValues = allNodes.map(
            (d) => d.y
        );

        const minX =
            Math.min(...xValues) -
            NODE_W / 2;

        const maxX =
            Math.max(...xValues) +
            NODE_W / 2;

        const minY =
            -NODE_H / 2;

        const maxY =
            Math.max(...yValues) +
            NODE_H / 2;

        const contentW =
            maxX - minX;

        const contentH =
            maxY - minY;

        const fit = Math.min(
            (CANVAS_W - PAD * 2) /
            contentW,

            (CANVAS_H - PAD * 2) /
            contentH,

            1.15
        );

        const xCenter =
            (minX + maxX) / 2;

        const place = (
            d: d3.HierarchyPointNode<TreeNode>
        ) => ({
            x:
                CANVAS_W / 2 +
                (d.x - xCenter) * fit,

            y:
                PAD +
                NODE_H / 2 +
                d.y * fit,
        });

        const posById: Record<
            string,
            {
                x: number;
                y: number;
            }
        > = {};

        allNodes.forEach((d) => {
            posById[d.data.id] =
                place(d);
        });

        const nodes: LayoutNode[] =
            allNodes.map((d) => ({
                id: d.data.id,
                label: d.data.label,
                depth: d.depth,
                isLeaf:
                    !d.children ||
                    d.children.length === 0,
                pos:
                    posById[d.data.id],
            }));

        const links: LayoutLink[] =
            root.links().map((link) => ({
                source:
                    posById[
                    link.source.data.id
                    ],

                target:
                    posById[
                    link.target.data.id
                    ],

                depth:
                    link.target.depth,
            }));

        return {
            nodes,
            links,
            fit,
        };
    }, [tree]);
}