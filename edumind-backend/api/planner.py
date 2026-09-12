from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.planner import StudyTask
from models.user import User


router = APIRouter(
    prefix="/api/planner",
    tags=["Study Planner"],
)


# ==================================================
# REQUEST MODELS
# ==================================================


class StudyTaskCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255,
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
    )

    task_date: date

    task_time: Optional[str] = Field(
        default=None,
        max_length=20,
    )

    duration: Optional[int] = Field(
        default=None,
        ge=1,
    )


class StudyTaskUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
    )

    task_date: Optional[date] = None

    task_time: Optional[str] = Field(
        default=None,
        max_length=20,
    )

    duration: Optional[int] = Field(
        default=None,
        ge=1,
    )

    completed: Optional[bool] = None


# ==================================================
# CREATE TASK
# ==================================================


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    request: StudyTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = StudyTask(
        user_id=current_user.id,
        title=request.title.strip(),
        description=(
            request.description.strip()
            if request.description
            else None
        ),
        task_date=request.task_date,
        task_time=request.task_time,
        duration=request.duration,
        completed=False,
    )

    if not task.title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task title cannot be empty.",
        )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# ==================================================
# GET USER TASKS
# ==================================================


@router.get("/")
def get_tasks(
    task_date: Optional[date] = None,
    completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
        )
    )

    if task_date is not None:
        query = query.filter(
            StudyTask.task_date == task_date,
        )

    if completed is not None:
        query = query.filter(
            StudyTask.completed == completed,
        )

    tasks = (
        query
        .order_by(
            StudyTask.task_date.asc(),
            StudyTask.created_at.desc(),
        )
        .all()
    )

    return tasks


# ==================================================
# GET TODAY'S TASKS
# ==================================================


@router.get("/today")
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    tasks = (
        db.query(StudyTask)
        .filter(
            StudyTask.user_id == current_user.id,
            StudyTask.task_date == today,
        )
        .order_by(
            StudyTask.created_at.asc(),
        )
        .all()
    )

    return tasks


# ==================================================
# UPDATE TASK
# ==================================================


@router.patch("/{task_id}")
def update_task(
    task_id: int,
    request: StudyTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(StudyTask)
        .filter(
            StudyTask.id == task_id,
            StudyTask.user_id == current_user.id,
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    update_data = request.model_dump(
        exclude_unset=True,
    )

    if "title" in update_data:
        title = (
            update_data["title"].strip()
            if update_data["title"]
            else ""
        )

        if not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task title cannot be empty.",
            )

        update_data["title"] = title

    if "description" in update_data:
        description = update_data["description"]

        update_data["description"] = (
            description.strip()
            if description
            else None
        )

    for field, value in update_data.items():
        setattr(
            task,
            field,
            value,
        )

    db.commit()
    db.refresh(task)

    return task


# ==================================================
# DELETE TASK
# ==================================================


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(StudyTask)
        .filter(
            StudyTask.id == task_id,
            StudyTask.user_id == current_user.id,
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Study task deleted successfully.",
        "task_id": task_id,
    }