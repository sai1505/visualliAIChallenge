import asyncio
import datetime
import json
import traceback
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.database import (
    save_mindmap,
    get_all_mindmaps,
    get_mindmap,
)
from app.generator import generate_mindmap
from app.schemas import (
    MindmapCreateResponse,
    MindmapCreateRequest,
    MindmapSummary,
)

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
        created_at = datetime.datetime.now(
            datetime.timezone.utc
        )

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

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong while creating the mindmap. Please try again.",
        ) from exc

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

@router.post("/stream")
async def create_mindmap_stream(
    request: MindmapCreateRequest,
):
    queue = asyncio.Queue()

    def on_phase(phase: str, data=None):
        queue.put_nowait(
            {
                "phase": phase,
                "data": data or {},
            }
        )

    async def event_stream():
        task = asyncio.create_task(
            asyncio.to_thread(
                generate_mindmap,
                request.text,
                on_phase,
            )
        )

        try:
            # Send phase events while generation is running
            while not task.done():
                try:
                    event = await asyncio.wait_for(
                        queue.get(),
                        timeout=0.1,
                    )

                    yield (
                        "event: phase\n"
                        f"data: {json.dumps(event)}\n\n"
                    )

                except asyncio.TimeoutError:
                    continue

            # Get the generated mindmap.
            # This also propagates exceptions from the worker.
            mindmap = await task

            # Persist the final mindmap.
            mindmap_id = str(uuid4())

            created_at = datetime.datetime.now(
                datetime.timezone.utc
            )

            save_mindmap(
                mindmap_id=mindmap_id,
                mindmap=mindmap,
                created_at=created_at,
            )

            result = {
                "id": mindmap_id,
                "title": mindmap.title,
                "rootId": mindmap.rootId,
                "nodes": [
                    node.model_dump()
                    for node in mindmap.nodes
                ],
                "connections": [
                    connection.model_dump(
                        by_alias=True
                    )
                    for connection in mindmap.connections
                ],
                "createdAt": created_at,
            }

            # Send final result.
            yield (
                "event: complete\n"
                f"data: {json.dumps(result, default=str)}\n\n"
            )

        except ValueError as exc:
            error = {
                "message": str(exc),
            }

            yield (
                "event: error\n"
                f"data: {json.dumps(error)}\n\n"
            )

        except RuntimeError as exc:
            error = {
                "message": str(exc),
            }

            yield (
                "event: error\n"
                f"data: {json.dumps(error)}\n\n"
            )

        except Exception:
            error = {
                "message": (
                    "Something went wrong while "
                    "creating the mindmap."
                ),
            }

            yield (
                "event: error\n"
                f"data: {json.dumps(error)}\n\n"
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )