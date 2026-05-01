from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None


class AddMemberRequest(BaseModel):
    email: EmailStr


async def require_admin(project_id: str, current_user=Depends(get_current_user)):
    membership = await db.projectmember.find_unique(
        where={"userId_projectId": {"userId": current_user.id, "projectId": project_id}}
    )
    if not membership or membership.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def require_member(project_id: str, current_user=Depends(get_current_user)):
    membership = await db.projectmember.find_unique(
        where={"userId_projectId": {"userId": current_user.id, "projectId": project_id}}
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return current_user


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_project(body: CreateProjectRequest, current_user=Depends(get_current_user)):
    project = await db.project.create(
        data={
            "name": body.name,
            "description": body.description,
            "members": {
                "create": [{"userId": current_user.id, "role": "ADMIN"}]
            },
        },
        include={"members": {"include": {"user": True}}},
    )
    return project


@router.get("/")
async def list_projects(current_user=Depends(get_current_user)):
    memberships = await db.projectmember.find_many(
        where={"userId": current_user.id},
        include={"project": {"include": {"members": True, "tasks": True}}},
    )
    return [
        {
            "id": m.project.id,
            "name": m.project.name,
            "description": m.project.description,
            "createdAt": m.project.createdAt,
            "role": m.role,
            "memberCount": len(m.project.members),
            "taskCount": len(m.project.tasks),
        }
        for m in memberships
    ]


@router.get("/{project_id}")
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    await require_member(project_id, current_user)
    project = await db.project.find_unique(
        where={"id": project_id},
        include={
            "members": {"include": {"user": True}},
            "tasks": {"include": {"assignedTo": True}},
        },
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get current user's role
    my_membership = next((m for m in project.members if m.userId == current_user.id), None)

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "createdAt": project.createdAt,
        "myRole": my_membership.role if my_membership else None,
        "members": [
            {
                "id": m.user.id,
                "name": m.user.name,
                "email": m.user.email,
                "role": m.role,
            }
            for m in project.members
        ],
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "dueDate": t.dueDate,
                "priority": t.priority,
                "status": t.status,
                "assignedTo": {"id": t.assignedTo.id, "name": t.assignedTo.name, "email": t.assignedTo.email}
                if t.assignedTo
                else None,
                "createdAt": t.createdAt,
            }
            for t in project.tasks
        ],
    }


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(project_id: str, body: AddMemberRequest, current_user=Depends(get_current_user)):
    await require_admin(project_id, current_user)

    user = await db.user.find_unique(where={"email": body.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.projectmember.find_unique(
        where={"userId_projectId": {"userId": user.id, "projectId": project_id}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = await db.projectmember.create(
        data={"userId": user.id, "projectId": project_id, "role": "MEMBER"}
    )
    return {"userId": user.id, "name": user.name, "email": user.email, "role": member.role}


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(project_id: str, user_id: str, current_user=Depends(get_current_user)):
    await require_admin(project_id, current_user)

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot remove themselves")

    await db.projectmember.delete(
        where={"userId_projectId": {"userId": user_id, "projectId": project_id}}
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    await require_admin(project_id, current_user)
    await db.project.delete(where={"id": project_id})
