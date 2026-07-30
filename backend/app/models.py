from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase
from sqlalchemy import func, ForeignKey
import datetime

class BaseModel(DeclarativeBase):
    __abstract__ = True
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(default=func.now(), server_default=func.now(), onupdate=func.now())

class UserModel(BaseModel):
    __tablename__ = 'users'
    username: Mapped[str]
    stats: Mapped['UserStatsModel'] = relationship(back_populates='user')

class UserStatsModel(BaseModel):
    __tablename__ = 'stats'
    total_score: Mapped[int] = mapped_column(default=0)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    user: Mapped[UserModel] = relationship(back_populates='stats')