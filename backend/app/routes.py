import datetime
import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.database import save_mindmap, get_all_mindmaps, get_mindmap
from app.generator import generate_mindmap
from app.schemas import MindmapCreateResponse, MindmapCreateRequest, MindmapSummary

router = APIRouter(
    prefix="/api/mindmaps",
    tags=["Mindmaps"],
)

@router.post(
    "",
    response_model=MindmapCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mindmap(request: MindmapCreateRequest):
    try:
        mindmap = generate_mindmap(request.text)
        mindmap_id = str(uuid4())
        created_at = datetime.datetime.now(datetime.timezone.utc)

        save_mindmap(
            mindmap_id=mindmap_id,
            mindmap=mindmap,
            created_at=created_at,
        )

        return {
            "id": mindmap_id,
            "title": mindmap.title,
            "rootId": mindmap.rootId,
            "nodes": mindmap.nodes,
            "connections": mindmap.connections,
            "createdAt": created_at,
        }

    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate a valid mindmap",
        )
    
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while generating mindmap",
        )

    '''except Exception as exc:
        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
    '''

@router.get(
    "",
    response_model=list[MindmapSummary],
)
def list_mindmaps():
    rows = get_all_mindmaps()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


@router.get(
    "/{mindmap_id}",
    response_model=MindmapCreateResponse,
)
def get_mindmap_by_id(mindmap_id: str):
    row = get_mindmap(mindmap_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mindmap not found",
        )

    mindmap = json.loads(row["mindmap_json"])

    return {
        "id": row["id"],
        "title": row["title"],
        "rootId": mindmap["rootId"],
        "nodes": mindmap["nodes"],
        "connections": mindmap["connections"],
        "createdAt": row["created_at"],
    }

