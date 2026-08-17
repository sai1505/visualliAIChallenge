import pytest
from pydantic import ValidationError

from app.models import (
    Mindmap,
    MindmapOutline,
    MindmapEnrichment,
)


def test_valid_mindmap():
    mindmap = Mindmap.model_validate(
        {
            "title": "Machine Learning",
            "rootId": "root",
            "nodes": [
                {
                    "id": "root",
                    "label": "Machine Learning",
                    "summary": "Systems learn from data.",
                },
                {
                    "id": "node_1",
                    "label": "Data",
                    "summary": "Data is used for learning.",
                },
                {
                    "id": "node_2",
                    "label": "Models",
                    "summary": "Models learn patterns.",
                },
                {
                    "id": "node_3",
                    "label": "Training",
                    "summary": "Training adjusts models.",
                },
                {
                    "id": "node_4",
                    "label": "Prediction",
                    "summary": "Models make predictions.",
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

    assert mindmap.rootId == "root"
    assert len(mindmap.nodes) == 5


def test_label_cannot_have_more_than_four_words():
    with pytest.raises(ValidationError):
        MindmapOutline.model_validate(
            {
                "title": "Test",
                "rootId": "root",
                "nodes": [
                    {
                        "id": "root",
                        "label": "This label has five words",
                    }
                ],
                "connections": [],
            }
        )


def test_enrichment_schema():
    enrichment = MindmapEnrichment.model_validate(
        {
            "summaries": [
                {
                    "id": "root",
                    "summary": "Main concept.",
                },
                {
                    "id": "node_1",
                    "summary": "Supporting concept.",
                },
            ]
        }
    )

    assert len(enrichment.summaries) == 2