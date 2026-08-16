import type { MindmapNode } from "../types/mindmap";

export function countNodes(node: MindmapNode): number {
    return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

export function maxDepth(node: MindmapNode, d = 0): number {
    return node.children.length
        ? Math.max(...node.children.map((c) => maxDepth(c, d + 1)))
        : d;
}

export function findNode(node: MindmapNode, id: string): MindmapNode | null {
    if (node.id === id) return node;
    for (const c of node.children) {
        const found = findNode(c, id);
        if (found) return found;
    }
    return null;
}

/** Greedy word-wrap for SVG <text>, capped at `maxLines` with an ellipsis. */
export function wrapLabel(label: string, maxChars = 15, maxLines = 2): string[] {
    const words = label.split(" ");
    const lines: string[] = [];
    let cur = "";

    for (const w of words) {
        const test = cur ? cur + " " + w : w;
        if (test.length <= maxChars) {
            cur = test;
        } else {
            if (cur) lines.push(cur);
            cur = w;
        }
        if (lines.length === maxLines) break;
    }
    if (lines.length < maxLines && cur) lines.push(cur);

    const consumed = lines.join(" ").split(" ").length;
    if (consumed < words.length) {
        let last = lines[lines.length - 1] || "";
        if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
        lines[lines.length - 1] = last.replace(/…$/, "") + "…";
    }
    return lines;
}