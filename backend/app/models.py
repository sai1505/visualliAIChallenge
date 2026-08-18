from pydantic import (
    BaseModel,
    Field,
    field_validator,
)

class Node(BaseModel):
    id: str
    label: str
    summary: str

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        value = value.strip()
        words = value.split()

        if not 1 <= len(words) <= 4:
            raise ValueError(
                "Label must contain 1-4 words"
            )

        return value

class Connection(BaseModel):
    from_: str = Field(alias="from")
    to: str
    label: str

class Mindmap(BaseModel):
    title: str
    rootId: str
    nodes: list[Node]
    connections: list[Connection]

# TWO-PHASE GENERATION MODELS
class OutlineNode(BaseModel):
    id: str
    label: str

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        value = value.strip()
        words = value.split()

        if not 1 <= len(words) <= 4:
            raise ValueError(
                "Label must contain 1-4 words"
            )

        return value

class OutlineConnection(BaseModel):
    from_: str = Field(alias="from")
    to: str
    label: str

class MindmapOutline(BaseModel):
    title: str
    rootId: str
    nodes: list[OutlineNode]
    connections: list[OutlineConnection]

class NodeSummary(BaseModel):
    id: str
    summary: str

class MindmapEnrichment(BaseModel):
    summaries: list[NodeSummary]