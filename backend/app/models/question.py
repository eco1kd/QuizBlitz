from sqlalchemy import String, Integer, ForeignKey, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Question(Base):
    __tablename__ = "questions"

    __table_args__ = (
        CheckConstraint("correct_index >= 0 AND correct_index < 4", name="check_correct_index"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)
    options: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str | None] = mapped_column(String, nullable=True)