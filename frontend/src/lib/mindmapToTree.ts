import type {
    Mindmap,
    MindmapNode,
} from "../types/mindmap";

export interface TreeNode extends MindmapNode {
    children: TreeNode[];
}

export function mindmapToTree(
    mindmap: Mindmap
): TreeNode | null {
    const nodeMap = new Map<string, TreeNode>();

    // Create a TreeNode for every backend node.
    for (const node of mindmap.nodes) {
        nodeMap.set(node.id, {
            ...node,
            children: [],
        });
    }

    // Find root.
    const root = nodeMap.get(mindmap.rootId);

    if (!root) {
        return null;
    }

    // Convert connections into parent -> child relationships.
    for (const connection of mindmap.connections) {
        const parent = nodeMap.get(connection.from);
        const child = nodeMap.get(connection.to);

        if (!parent || !child) {
            continue;
        }

        // Prevent duplicate children.
        const alreadyExists = parent.children.some(
            (existing) => existing.id === child.id
        );

        if (!alreadyExists) {
            parent.children.push(child);
        }
    }

    return root;
}

export function countTreeNodes(
    root: TreeNode
): number {
    let count = 0;

    function walk(node: TreeNode) {
        count++;

        for (const child of node.children) {
            walk(child);
        }
    }

    walk(root);

    return count;
}

export function maxTreeDepth(
    root: TreeNode
): number {
    function depth(node: TreeNode): number {
        if (node.children.length === 0) {
            return 1;
        }

        return (
            1 +
            Math.max(
                ...node.children.map(depth)
            )
        );
    }

    return depth(root);
}