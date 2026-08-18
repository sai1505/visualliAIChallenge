from app.models import Mindmap
from app.models import MindmapOutline, MindmapEnrichment

def validate_outline(
    outline: MindmapOutline,
) -> MindmapOutline:
    """
    Validates the structural output of Phase 1.

    Phase 1 is responsible only for:
    - title
    - nodes
    - connections

    Summaries are intentionally not part of this phase.
    """

    node_ids = {
        node.id
        for node in outline.nodes
    }

    # 1. Node count
    if not 5 <= len(outline.nodes) <= 9:
        raise ValueError(
            "Mindmap outline must contain "
            "between 5 and 9 nodes"
        )

    # 2. Unique IDs
    if len(node_ids) != len(outline.nodes):
        raise ValueError(
            "Node IDs must be unique"
        )

    # 3. Root ID
    if outline.rootId != "root":
        raise ValueError(
            'rootId must be "root"'
        )

    # 4. Root must exist
    if "root" not in node_ids:
        raise ValueError(
            'Root node with id "root" is required'
        )

    # 5. Validate node IDs
    for node in outline.nodes:

        if node.id == "root":
            continue
        if not node.id.startswith("node_"):
            raise ValueError(
                f"Invalid node ID: {node.id}"
            )
        suffix = node.id.removeprefix("node_")
        if not suffix.isdigit():
            raise ValueError(
                f"Invalid node ID: {node.id}"
            )

    # 6. Validate connections
    for connection in outline.connections:
        if connection.from_ not in node_ids:
            raise ValueError(
                "Connection source does not exist: "
                f"{connection.from_}"
            )
        if connection.to not in node_ids:
            raise ValueError(
                "Connection target does not exist: "
                f"{connection.to}"
            )
        # 7. No self-connections
        if connection.from_ == connection.to:
            raise ValueError(
                "Self-connection detected: "
                f"{connection.from_}"
            )

    # 8. Every non-root node should participate
    # in at least one connection.
    connected_nodes = set()

    for connection in outline.connections:
        connected_nodes.add(
            connection.from_
        )
        connected_nodes.add(
            connection.to
        )

    disconnected = (
        node_ids
        - connected_nodes
        - {"root"}
    )

    if disconnected:
        raise ValueError(
            "Disconnected nodes detected: "
            f"{sorted(disconnected)}"
        )

    return outline


def validate_enrichment(
    enrichment: MindmapEnrichment,
    outline: MindmapOutline,
) -> MindmapEnrichment:
    """
    Validates Phase 2 enrichment.
    Phase 2 is only allowed to provide summaries for nodes that already exist in the outline.
    """

    outline_ids = {
        node.id
        for node in outline.nodes
    }
    summary_ids = {
        summary.id
        for summary in enrichment.summaries
    }

    # 1. Every outline node must have a summary
    missing = outline_ids - summary_ids
    if missing:
        raise ValueError(
            "Missing summaries for nodes: "
            f"{sorted(missing)}"
        )

    # 2. Phase 2 must not create extra nodes
    extra = summary_ids - outline_ids
    if extra:
        raise ValueError(
            "Enrichment contains unknown nodes: "
            f"{sorted(extra)}"
        )

    # 3. Summary IDs must be unique
    if (
        len(summary_ids)
        != len(enrichment.summaries)
    ):
        raise ValueError(
            "Summary node IDs must be unique"
        )

    # 4. Summaries must not be empty
    for item in enrichment.summaries:

        if not item.summary.strip():
            raise ValueError(
                f"Summary cannot be empty for "
                f"node: {item.id}"
            )

    return enrichment


def validate_mindmap(
    mindmap: Mindmap,
) -> Mindmap:
    """
    Final backstop validation for an
    LLM-generated mindmap.

    Raises ValueError when the mindmap
    violates application rules.
    """

    node_ids = {
        node.id
        for node in mindmap.nodes
    }

    # 1. Node count
    if not 5 <= len(mindmap.nodes) <= 9:
        raise ValueError(
            "Mindmap must contain between "
            "5 and 9 nodes"
        )

    # 2. Unique IDs
    if len(node_ids) != len(mindmap.nodes):
        raise ValueError(
            "Node IDs must be unique"
        )

    # 3. Root must be exactly "root"
    if mindmap.rootId != "root":
        raise ValueError(
            'rootId must be "root"'
        )

    # 4. Root exists
    if mindmap.rootId not in node_ids:
        raise ValueError(
            "rootId must reference an existing node"
        )

    # 5. Validate node IDs
    for node in mindmap.nodes:
        if node.id == "root":
            continue
        if not node.id.startswith("node_"):
            raise ValueError(
                f"Invalid node ID: {node.id}"
            )

    # 6. Connections reference real nodes
    for connection in mindmap.connections:
        if connection.from_ not in node_ids:
            raise ValueError(
                "Connection source does not exist: "
                f"{connection.from_}"
            )
        if connection.to not in node_ids:
            raise ValueError(
                "Connection target does not exist: "
                f"{connection.to}"
            )

        # 7. No self-connections
        if connection.from_ == connection.to:
            raise ValueError(
                "Self-connection detected: "
                f"{connection.from_}"
            )

    # 8. Every non-root node should be connected
    connected_nodes = set()
    for connection in mindmap.connections:
        connected_nodes.add(
            connection.from_
        )
        connected_nodes.add(
            connection.to
        )
    disconnected = (
        node_ids
        - connected_nodes
        - {"root"}
    )
    if disconnected:
        raise ValueError(
            "Disconnected nodes detected: "
            f"{sorted(disconnected)}"
        )
    return mindmap