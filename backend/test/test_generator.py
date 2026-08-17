from unittest.mock import MagicMock

from app.generator import (
    parse_and_validate_outline,
    parse_and_validate_enrichment,
    combine_mindmap,
)


def test_parse_valid_outline():
    content = """
    {
        "title": "Machine Learning",
        "rootId": "root",
        "nodes": [
            {
                "id": "root",
                "label": "Machine Learning"
            },
            {
                "id": "node_1",
                "label": "Data"
            },
            {
                "id": "node_2",
                "label": "Models"
            },
            {
                "id": "node_3",
                "label": "Training"
            },
            {
                "id": "node_4",
                "label": "Prediction"
            }
        ],
        "connections": [
            {
                "from": "root",
                "to": "node_1",
                "label": "uses"
            },
            {
                "from": "root",
                "to": "node_2",
                "label": "creates"
            },
            {
                "from": "node_2",
                "to": "node_3",
                "label": "requires"
            },
            {
                "from": "node_2",
                "to": "node_4",
                "label": "produces"
            }
        ]
    }
    """

    outline = parse_and_validate_outline(content)

    assert outline.rootId == "root"
    assert len(outline.nodes) == 5


def test_parse_invalid_outline():
    content = """
    {
        "title": "Machine Learning",
        "rootId": "wrong",
        "nodes": [
            {
                "id": "root",
                "label": "Machine Learning"
            },
            {
                "id": "node_1",
                "label": "Data"
            },
            {
                "id": "node_2",
                "label": "Models"
            },
            {
                "id": "node_3",
                "label": "Training"
            },
            {
                "id": "node_4",
                "label": "Prediction"
            }
        ],
        "connections": []
    }
    """

    try:
        parse_and_validate_outline(content)
        assert False, "Expected outline validation to fail"
    except ValueError:
        assert True


def test_parse_valid_enrichment():
    from app.models import MindmapOutline

    outline = MindmapOutline.model_validate(
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

    content = """
    {
        "summaries": [
            {
                "id": "root",
                "summary": "Machine learning systems learn from data."
            },
            {
                "id": "node_1",
                "summary": "Data provides information for learning."
            },
            {
                "id": "node_2",
                "summary": "Models learn patterns from data."
            },
            {
                "id": "node_3",
                "summary": "Training adjusts model parameters."
            },
            {
                "id": "node_4",
                "summary": "Models make predictions."
            }
        ]
    }
    """

    enrichment = parse_and_validate_enrichment(
        content,
        outline,
    )

    assert len(enrichment.summaries) == 5


def test_combine_outline_and_enrichment():
    from app.models import (
        MindmapOutline,
        MindmapEnrichment,
    )

    outline = MindmapOutline.model_validate(
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

    enrichment = MindmapEnrichment.model_validate(
        {
            "summaries": [
                {
                    "id": node.id,
                    "summary": f"Summary for {node.label}.",
                }
                for node in outline.nodes
            ]
        }
    )

    mindmap = combine_mindmap(
        outline,
        enrichment,
    )

    assert mindmap.rootId == "root"
    assert len(mindmap.nodes) == 5
    assert mindmap.nodes[0].summary != ""


def test_invalid_json_is_rejected():
    try:
        parse_and_validate_outline(
            "this is not json"
        )
        assert False, "Expected ValueError"
    except ValueError:
        assert True