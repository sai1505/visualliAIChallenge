export interface MindmapNode {
    id: string;
    label: string;
    summary: string;
}

export interface MindmapConnection {
    from: string;
    to: string;
    label: string;
}

export interface Mindmap {
    id: string;
    title: string;
    rootId: string;
    nodes: MindmapNode[];
    connections: MindmapConnection[];
    createdAt: string;
}