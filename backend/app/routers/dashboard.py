from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/")
async def get_dashboard(current_user=Depends(get_current_user)):
    # Get all projects user belongs to
    memberships = await db.projectmember.find_many(
        where={"userId": current_user.id},
        include={"project": True},
    )
    project_ids = [m.projectId for m in memberships]

    if not project_ids:
        return {
            "totalProjects": 0,
            "totalTasks": 0,
            "tasksByStatus": {"TODO": 0, "IN_PROGRESS": 0, "DONE": 0},
            "tasksByPriority": {"LOW": 0, "MEDIUM": 0, "HIGH": 0},
            "overdueTasks": 0,
            "myAssignedTasks": 0,
            "recentTasks": [],
            "projects": [],
        }

    # All tasks across user's projects
    all_tasks = await db.task.find_many(
        where={"projectId": {"in": project_ids}},
        include={"assignedTo": True, "project": True},
        order={"createdAt": "desc"},
    )

    now = datetime.now(timezone.utc)

    tasks_by_status = {"TODO": 0, "IN_PROGRESS": 0, "DONE": 0}
    tasks_by_priority = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    tasks_by_user = {}
    overdue = 0
    my_assigned = 0

    for t in all_tasks:
        tasks_by_status[t.status] = tasks_by_status.get(t.status, 0) + 1
        tasks_by_priority[t.priority] = tasks_by_priority.get(t.priority, 0) + 1
        if t.assignedTo:
            tasks_by_user[t.assignedTo.name] = tasks_by_user.get(t.assignedTo.name, 0) + 1
        if t.dueDate and t.dueDate.replace(tzinfo=timezone.utc) < now and t.status != "DONE":
            overdue += 1
        if t.assignedToId == current_user.id:
            my_assigned += 1

    recent_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "dueDate": t.dueDate,
            "projectName": t.project.name,
            "assignedTo": {"id": t.assignedTo.id, "name": t.assignedTo.name} if t.assignedTo else None,
        }
        for t in all_tasks[:10]
    ]

    projects_summary = [
        {
            "id": m.projectId,
            "name": m.project.name,
            "role": m.role,
        }
        for m in memberships
    ]

    return {
        "totalProjects": len(memberships),
        "totalTasks": len(all_tasks),
        "tasksByStatus": tasks_by_status,
        "tasksByPriority": tasks_by_priority,
        "tasksByUser": tasks_by_user,
        "overdueTasks": overdue,
        "myAssignedTasks": my_assigned,
        "recentTasks": recent_tasks,
        "projects": projects_summary,
    }
