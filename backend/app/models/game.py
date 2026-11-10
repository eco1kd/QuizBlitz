from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Game(Base):
    __tablename__ = "games"

    __table_args__ = (
        CheckConstraint("status IN ('waiting', 'active', 'finished')", name="check_game_status"),
        CheckConstraint("length(code) = 6", name="check_game_code_length"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(6), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="waiting", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)