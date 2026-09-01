from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from core.database import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    event_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    material_id = Column(
        Integer,
        ForeignKey(
            "materials.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    score = Column(
        Float,
        nullable=True,
    )

    total = Column(
        Integer,
        nullable=True,
    )

    item_count = Column(
        Integer,
        nullable=True,
    )

    difficulty = Column(
        String(20),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )