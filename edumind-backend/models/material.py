from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)
    size = Column(String(50), nullable=False)
    time = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )