from sqlalchemy import Integer, Boolean, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Answer(Base):
    __tablename__ = "answers"

    __table_args__ = (
        UniqueConstraint("game_id", "player_id", "question_id", name="unique_player_answer"),
        CheckConstraint("option_index >= 0 AND option_index < 4", name="check_option_index"),
        CheckConstraint("time_ms >= 0", name="check_answer_time"),
        CheckConstraint("points >= 0", name="check_answer_points"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("game_players.id"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), nullable=False)
    option_index: Mapped[int] = mapped_column(Integer, nullable=False)
    correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)