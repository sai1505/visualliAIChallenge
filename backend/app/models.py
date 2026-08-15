from pydantic import BaseModel, Field, field_validator, model_validator


class Node(BaseModel):
    id: str
    label: str
    summary: str

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        words = value.split()

        if not 1 <= len(words) <= 4:
            raise ValueError("Label must contain 1-4 words")

        return value.strip()


class Connection(BaseModel):
    from_: str = Field(alias="from")
    to: str
    label: str


class Mindmap(BaseModel):
    title: str
    rootId: str
    nodes: list[Node]
    connections: list[Connection]