import {
  memo,
  useEffect,
  useMemo,
} from "react";

import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import dagre from "@dagrejs/dagre";

import type {
  Mindmap,
  MindmapNode,
} from "../types/mindmap";

import type { Theme } from "../constants/theme";


/* =========================================================
   Types
   ========================================================= */

interface MindmapCanvasProps {
  mindmap: Mindmap;
  theme: Theme;
  selectedNode: MindmapNode | null;
  onNodeSelect: (
    node: MindmapNode | null
  ) => void;
}


type MindmapNodeData = {
  node: MindmapNode;
  depth: number;
  theme: Theme;
} & Record<string, unknown>;


type MindmapFlowNodeType =
  Node<
    MindmapNodeData,
    "mindmap"
  >;


/* =========================================================
   Constants
   ========================================================= */

const NODE_WIDTH = 190;
const NODE_HEIGHT = 68;

const RANK_SEPARATION = 80;
const NODE_SEPARATION = 30;


/* =========================================================
   Custom Node
   ========================================================= */

const MindmapFlowNode = memo(
  function MindmapFlowNode({
    data,
    selected,
  }: NodeProps<MindmapFlowNodeType>) {
    const {
      node,
      depth,
      theme,
    } = data;

    const isRoot =
      node.id === "root" ||
      depth === 0;

    return (
      <>
        {/* Incoming edge */}

        {!isRoot && (
          <Handle
            type="target"
            position={
              Position.Top
            }
            className="
                            !h-1
                            !w-1
                            !border-0
                            !bg-transparent
                        "
          />
        )}

        {/* Node */}

        <div
          className="
                        flex
                        h-[68px]
                        w-[190px]
                        items-center
                        justify-center
                        rounded-2xl
                        px-4
                        text-center
                        transition-[box-shadow,border-color]
                        duration-150
                    "
          style={{
            backgroundColor:
              isRoot
                ? theme.ink
                : theme.canvasBg,

            color:
              isRoot
                ? theme.canvasBg
                : theme.ink,

            border:
              selected
                ? `2px solid ${theme.ink}`
                : `1px solid ${theme.panelBorder}`,

            boxShadow:
              selected
                ? `0 0 0 4px ${theme.ink}18`
                : "0 4px 16px rgba(0,0,0,0.06)",

            fontWeight:
              isRoot
                ? 700
                : 500,

            fontSize:
              isRoot
                ? 15
                : 13,

            lineHeight:
              1.25,
          }}
        >
          <span className="break-words">
            {node.label}
          </span>
        </div>

        {/* Outgoing edge */}

        <Handle
          type="source"
          position={
            Position.Bottom
          }
          className="
                        !h-1
                        !w-1
                        !border-0
                        !bg-transparent
                    "
        />
      </>
    );
  }
);

MindmapFlowNode.displayName =
  "MindmapFlowNode";


/* =========================================================
   Node Types
   ========================================================= */

const nodeTypes = {
  mindmap: MindmapFlowNode,
};


/* =========================================================
   Calculate Node Depth
   ========================================================= */

function calculateDepths(
  mindmap: Mindmap
) {
  const depthById =
    new Map<string, number>();

  depthById.set(
    mindmap.rootId,
    0
  );

  let changed = true;

  while (changed) {
    changed = false;

    for (
      const connection of
      mindmap.connections
    ) {
      const parentDepth =
        depthById.get(
          connection.from
        );

      if (
        parentDepth ===
        undefined
      ) {
        continue;
      }

      const nextDepth =
        parentDepth + 1;

      const currentDepth =
        depthById.get(
          connection.to
        );

      if (
        currentDepth ===
        undefined ||
        nextDepth <
        currentDepth
      ) {
        depthById.set(
          connection.to,
          nextDepth
        );

        changed = true;
      }
    }
  }

  return depthById;
}


/* =========================================================
   Dagre Layout
   ========================================================= */

function getLayoutedElements(
  nodes: MindmapFlowNodeType[],
  edges: Edge[]
) {
  const graph =
    new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(
    () => ({})
  );

  graph.setGraph({
    rankdir: "TB",
    ranksep:
      RANK_SEPARATION,
    nodesep:
      NODE_SEPARATION,
    marginx: 40,
    marginy: 40,
  });

  for (
    const node of nodes
  ) {
    graph.setNode(
      node.id,
      {
        width:
          NODE_WIDTH,
        height:
          NODE_HEIGHT,
      }
    );
  }

  for (
    const edge of edges
  ) {
    graph.setEdge(
      edge.source,
      edge.target
    );
  }

  dagre.layout(graph);

  const layoutedNodes =
    nodes.map((node) => {
      const position =
        graph.node(
          node.id
        );

      return {
        ...node,

        position: {
          x:
            position.x -
            NODE_WIDTH / 2,

          y:
            position.y -
            NODE_HEIGHT / 2,
        },
      };
    });

  return {
    nodes:
      layoutedNodes,
    edges,
  };
}


/* =========================================================
   Component
   ========================================================= */

export default function MindmapCanvas({
  mindmap,
  theme,
  selectedNode,
  onNodeSelect,
}: MindmapCanvasProps) {

  /* -----------------------------------------------------
     Nodes
     ----------------------------------------------------- */

  const baseNodes =
    useMemo<
      MindmapFlowNodeType[]
    >(() => {
      const depthById =
        calculateDepths(
          mindmap
        );

      return mindmap.nodes.map(
        (node) => ({
          id: node.id,

          type: "mindmap",

          position: {
            x: 0,
            y: 0,
          },

          data: {
            node,

            depth:
              depthById.get(
                node.id
              ) ?? 0,

            theme,
          },

          draggable: false,

          selectable: true,
        })
      );
    }, [
      mindmap,
      theme,
    ]);


  /* -----------------------------------------------------
     Edges
     ----------------------------------------------------- */

  const baseEdges =
    useMemo<Edge[]>(
      () =>
        mindmap.connections.map(
          (
            connection,
            index
          ) => ({
            id:
              `edge-${connection.from}-${connection.to}-${index}`,

            source:
              connection.from,

            target:
              connection.to,

            type:
              "smoothstep",

            label:
              connection.label,

            style: {
              stroke:
                theme.ink,

              strokeWidth:
                1.5,

              opacity:
                0.55,
            },

            labelStyle: {
              fill:
                theme.muted,

              fontSize: 10,

              fontWeight:
                500,
            },

            labelBgStyle: {
              fill:
                theme.canvasBg,

              fillOpacity:
                0.95,
            },

            labelBgPadding: [
              5,
              3,
            ],

            labelBgBorderRadius:
              5,

            interactionWidth:
              20,
          })
        ),
      [
        mindmap.connections,
        theme,
      ]
    );


  /* -----------------------------------------------------
     Layout
     ----------------------------------------------------- */

  const {
    nodes,
    edges,
  } = useMemo(
    () =>
      getLayoutedElements(
        baseNodes,
        baseEdges
      ),
    [
      baseNodes,
      baseEdges,
    ]
  );


  /* -----------------------------------------------------
     Keyboard
     ----------------------------------------------------- */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onNodeSelect(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    onNodeSelect,
  ]);


  /* -----------------------------------------------------
     Node Click
     ----------------------------------------------------- */

  function handleNodeClick(
    _: React.MouseEvent,
    node: MindmapFlowNodeType
  ) {
    const clickedNode =
      node.data.node;

    if (
      selectedNode?.id ===
      clickedNode.id
    ) {
      onNodeSelect(null);

      return;
    }

    onNodeSelect(
      clickedNode
    );
  }


  /* -----------------------------------------------------
     Render
     ----------------------------------------------------- */

  return (
    <div
      className="
                relative
                h-[600px]
                w-full
                overflow-hidden
                rounded-2xl
                border
            "
      style={{
        backgroundColor:
          theme.canvasBg,

        borderColor:
          theme.panelBorder,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={() => onNodeSelect(null)}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        fitViewOptions={{
          padding: 0.18,
          minZoom: 0.35,
          maxZoom: 1.4,
        }}
        minZoom={0.25}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
        proOptions={{
          hideAttribution: true,
        }}
        style={{
          background: theme.canvasBg,
        }}
      >
        <Controls
          showInteractive={false}
          className="
        !overflow-hidden
        !rounded-xl
        !border
        !shadow-md
  "
        />
      </ReactFlow>
    </div>
  );
}