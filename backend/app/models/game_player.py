from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class GamePlayer(Base):
    __tablename__ = "game_players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    nickname: Mapped[str] = mapped_column(String, nullable=False)
    final_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    final_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)