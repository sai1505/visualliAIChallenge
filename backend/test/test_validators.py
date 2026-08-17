import pytest

from app.models import (
    Mindmap,
    MindmapEnrichment,
    MindmapOutline,
)
from app.validators import (
    validate_mindmap,
    validate_outline,
    validate_enrichment,
)


def valid_outline() -> MindmapOutline:
    return MindmapOutline.model_validate(
        {
            "title": "Machine Learning",
            "rootId": "root",
            "nodes": [
                {
                    "id": "root",
                    "label": "Machine Learning",
                },
                {
                    "id": "node_1",
                    "label": "Data",
                },
                {
                    "id": "node_2",
                    "label": "Models",
                },
                {
                    "id": "node_3",
                    "label": "Training",
                },
                {
                    "id": "node_4",
                    "label": "Prediction",
                },
            ],
            "connections": [
                {
                    "from": "root",
                    "to": "node_1",
                    "label": "uses",
                },
                {
                    "from": "root",
                    "to": "node_2",
                    "label": "creates",
                },
                {
                    "from": "node_2",
                    "to": "node_3",
                    "label": "requires",
                },
                {
                    "from": "node_2",
                    "to": "node_4",
                    "label": "produces",
                },
            ],
        }
    )


def test_valid_outline():
    outline = valid_outline()

    result = validate_outline(outline)

    assert result.rootId == "root"
    assert len(result.nodes) == 5


def test_outline_rejects_wrong_root():
    outline = valid_outline()

    outline.rootId = "node_1"

    with pytest.raises(ValueError, match="root"):
        validate_outline(outline)


def test_outline_rejects_invalid_connection():
    outline = valid_outline()

    outline.connections[0].to = "node_999"

    with pytest.raises(
        ValueError,
        match="Connection target does not exist",
    ):
        validate_outline(outline)


def test_enrichment_requires_every_node():
    outline = valid_outline()

    enrichment = MindmapEnrichment.model_validate(
        {
            "summaries": [
                {
                    "id": "root",
                    "summary": "Main concept.",
                }
            ]
        }
    )

    with pytest.raises(
        ValueError,
        match="Missing summaries",
    ):
        validate_enrichment(
            enrichment,
            outline,
        )


def test_enrichment_rejects_unknown_node():
    outline = valid_outline()

    enrichment = MindmapEnrichment.model_validate(
        {
            "summaries": [
                {
                    "id": node.id,
                    "summary": "Summary.",
                }
                for node in outline.nodes
            ]
            + [
                {
                    "id": "node_999",
                    "summary": "Unknown.",
                }
            ]
        }
    )

    with pytest.raises(
        ValueError,
        match="unknown nodes",
    ):
        validate_enrichment(
            enrichment,
            outline,
        )