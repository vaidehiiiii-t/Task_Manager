from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["tasks"])


async def get_membership(project_id: str, current_user=Depends(get_current_user)):
    membership = await db.projectmember.find_unique(
        where={"userId_projectId": {"userId": current_user.id, "projectId": project_id}}
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return membership


class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    dueDate: Optional[datetime] = None
    priority: Optional[str] = "MEDIUM"
    assignedToId: Optional[str] = None


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignedToId: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: str,
    body: CreateTaskRequest,
    current_user=Depends(get_current_user),
):
    membership = await get_membership(project_id, current_user)
    if membership.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can create tasks")

    task = await db.task.create(
        data={
            "title": body.title,
            "description": body.description or "",
            "dueDate": body.dueDate,
            "priority": body.priority or "MEDIUM",
            "status": "TODO",
            "projectId": project_id,
            "assignedToId": body.assignedToId,
        },
        include={"assignedTo": True},
    )
    return _format_task(task)


@router.get("")
async def list_tasks(project_id: str, current_user=Depends(get_current_user)):
    membership = await get_membership(project_id, current_user)

    where = {"projectId": project_id}
    if membership.role == "MEMBER":
        where["assignedToId"] = current_user.id

    tasks = await db.task.find_many(
        where=where,
        include={"assignedTo": True},
        order={"createdAt": "desc"},
    )
    return [_format_task(t) for t in tasks]


@router.put("/{task_id}")
async def update_task(
    project_id: str,
    task_id: str,
    body: UpdateTaskRequest,
    current_user=Depends(get_current_user),
):
    membership = await get_membership(project_id, current_user)

    task = await db.task.find_unique(where={"id": task_id})
    if not task or task.projectId != project_id:
        raise HTTPException(status_code=404, detail="Task not found")

    is_admin = membership.role == "ADMIN"
    is_assigned = task.assignedToId == current_user.id

    if not is_admin and not is_assigned:
        raise HTTPException(status_code=403, detail="Access denied")

    # Members can only update status
    if not is_admin:
        allowed_fields = {"status"}
        provided_fields = {k for k, v in body.model_dump(exclude_none=True).items()}
        if not provided_fields.issubset(allowed_fields):
            raise HTTPException(status_code=403, detail="Members can only update task status")

    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        return _format_task(task)

    updated = await db.task.update(
        where={"id": task_id},
        data=update_data,
        include={"assignedTo": True},
    )
    return _format_task(updated)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: str,
    task_id: str,
    current_user=Depends(get_current_user),
):
    membership = await get_membership(project_id, current_user)
    if membership.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can delete tasks")

    task = await db.task.find_unique(where={"id": task_id})
    if not task or task.projectId != project_id:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.task.delete(where={"id": task_id})


def _format_task(task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "dueDate": task.dueDate,
        "priority": task.priority,
        "status": task.status,
        "projectId": task.projectId,
        "assignedTo": {
            "id": task.assignedTo.id,
            "name": task.assignedTo.name,
            "email": task.assignedTo.email,
        }
        if task.assignedTo
        else None,
        "createdAt": task.createdAt,
    }
