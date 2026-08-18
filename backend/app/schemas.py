from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.models import Connection, Node

class MindmapCreateRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=20_000,
        description="Source text used to generate the mindmap",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Text cannot be empty")

        if len(value.split()) < 3:
            raise ValueError(
                "Text is too short to generate a meaningful mindmap"
            )

        return value


class MindmapCreateResponse(BaseModel):
    id: str
    title: str
    rootId: str
    nodes: list[Node]
    connections: list[Connection]
    createdAt: datetime


class MindmapSummary(BaseModel):
    id: str
    title: str
    createdAt: datetime