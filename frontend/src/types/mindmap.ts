export interface MindmapNode {
    id: string;
    label: string;
    summary: string;
    children: MindmapNode[];
}

export type Mindmap = MindmapNode;

export type NodeKind = "root" | "branch" | "leaf";

export function nodeKind(node: MindmapNode, isRoot: boolean): NodeKind {
    if (isRoot) return "root";
    return node.children.length > 0 ? "branch" : "leaf";
}
