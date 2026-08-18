import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import Mindmap


client = TestClient(app)


# ============================================================
# Shared fixture
# ============================================================

@pytest.fixture
def sample_mindmap():
    return Mindmap.model_validate(
        {
            "title": "Machine Learning",
            "rootId": "root",
            "nodes": [
                {
                    "id": "root",
                    "label": "Machine Learning",
                    "summary": (
                        "Machine learning enables "
                        "systems to learn from data."
                    ),
                },
                {
                    "id": "node_1",
                    "label": "Data",
                    "summary": (
                        "Data provides information "
                        "used for learning."
                    ),
                },
                {
                    "id": "node_2",
                    "label": "Models",
                    "summary": (
                        "Models learn patterns "
                        "from training data."
                    ),
                },
                {
                    "id": "node_3",
                    "label": "Training",
                    "summary": (
                        "Training adjusts model "
                        "parameters using examples."
                    ),
                },
                {
                    "id": "node_4",
                    "label": "Prediction",
                    "summary": (
                        "Trained models make "
                        "predictions on new inputs."
                    ),
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


# ============================================================
# TEST 1
# Request validation failure
# ============================================================

def test_create_mindmap_rejects_empty_text():
    response = client.post(
        "/api/mindmaps/stream",
        json={
            "text": ""
        },
    )

    assert response.status_code in (400, 422)

    body = response.json()

    assert "detail" in body


# ============================================================
# TEST 2
# Successful create flow
# ============================================================

def test_create_mindmap_success(
    monkeypatch,
    sample_mindmap,
):
    from app import routes as mindmaps

    saved = {}

    def fake_generate_mindmap(text, on_phase=None):
        assert text == (
            "Machine learning uses data "
            "to train models."
        )

        if on_phase:
            on_phase("outline_started")
            on_phase(
                "outline_completed",
                {"nodeCount": 5},
            )
            on_phase("enrichment_started")
            on_phase("enrichment_completed")

        return sample_mindmap

    def fake_save_mindmap(
        mindmap_id,
        mindmap,
        created_at,
    ):
        saved["id"] = mindmap_id
        saved["mindmap"] = mindmap
        saved["created_at"] = created_at

    monkeypatch.setattr(
        mindmaps,
        "generate_mindmap",
        fake_generate_mindmap,
    )

    monkeypatch.setattr(
        mindmaps,
        "save_mindmap",
        fake_save_mindmap,
    )

    response = client.post(
        "/api/mindmaps/stream",
        json={
            "text": (
                "Machine learning uses data "
                "to train models."
            )
        },
    )

    assert response.status_code == 200

    body = response.text

    # Streaming phases were emitted.
    assert "outline_started" in body
    assert "outline_completed" in body
    assert "enrichment_started" in body
    assert "enrichment_completed" in body

    # Generation completed.
    assert "event: complete" in body
    assert "Machine Learning" in body

    # Persistence happened.
    assert "id" in saved
    assert saved["mindmap"] == sample_mindmap


# ============================================================
# TEST 3
# Successful retry after invalid LLM response
# ============================================================

def test_generator_retries_after_invalid_llm_response(
    monkeypatch,
):
    from app.generator import generate_outline

    class FakeMessage:
        def __init__(self, content):
            self.content = content

    class FakeChoice:
        def __init__(self, content):
            self.message = FakeMessage(content)

    class FakeResponse:
        def __init__(self, content):
            self.choices = [
                FakeChoice(content)
            ]

    class FakeCompletions:
        def __init__(self):
            self.calls = 0

        def create(self, **kwargs):
            self.calls += 1

            # First LLM response is invalid.
            if self.calls == 1:
                return FakeResponse(
                    '{"invalid": true}'
                )

            # Second response is valid.
            return FakeResponse(
                """
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
            )

    class FakeChat:
        def __init__(self):
            self.completions = (
                FakeCompletions()
            )

    class FakeClient:
        def __init__(self):
            self.chat = FakeChat()

    fake_client = FakeClient()

    result = generate_outline(
        fake_client,
        (
            "Machine learning uses "
            "data to train models."
        ),
    )

    assert result.title == "Machine Learning"
    assert result.rootId == "root"

    assert len(result.nodes) == 5

    assert result.nodes[0].id == "root"
    assert result.nodes[1].id == "node_1"
    assert result.nodes[2].id == "node_2"

    assert (
        fake_client.chat.completions.calls
        == 2
    )