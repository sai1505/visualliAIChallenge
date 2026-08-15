from app.models import Mindmap


def validate_mindmap(mindmap: Mindmap) -> Mindmap:
    """
    Final backstop validation for an LLM-generated mindmap.

    Raises ValueError when the mindmap violates application rules.
    """

    node_ids = {node.id for node in mindmap.nodes}

    # 1. Node count
    if not 5 <= len(mindmap.nodes) <= 9:
        raise ValueError("Mindmap must contain between 5 and 9 nodes")

    # 2. Unique IDs
    if len(node_ids) != len(mindmap.nodes):
        raise ValueError("Node IDs must be unique")

    # 3. Root exists
    if mindmap.rootId not in node_ids:
        raise ValueError("rootId must reference an existing node")

    # 4. Connections reference real nodes
    for connection in mindmap.connections:

        if connection.from_ not in node_ids:
            raise ValueError(
                f"Connection source does not exist: {connection.from_}"
            )

        if connection.to not in node_ids:
            raise ValueError(
                f"Connection target does not exist: {connection.to}"
            )

    # 5. No self-connections
    for connection in mindmap.connections:

        if connection.from_ == connection.to:
            raise ValueError(
                f"Self-connection detected: {connection.from_}"
            )

    # 6. Every node except root should be connected
    connected_nodes = set()

    for connection in mindmap.connections:
        connected_nodes.add(connection.from_)
        connected_nodes.add(connection.to)

    disconnected = node_ids - connected_nodes

    if disconnected:
        raise ValueError(
            f"Disconnected nodes detected: {sorted(disconnected)}"
        )

    return mindmap