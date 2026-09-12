from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from core.database import Base


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    description = Column(
        String(1000),
        nullable=True,
    )

    task_date = Column(
        Date,
        nullable=False,
        index=True,
    )

    task_time = Column(
        String(20),
        nullable=True,
    )

    duration = Column(
        Integer,
        nullable=True,
    )

    completed = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )