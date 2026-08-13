from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase
from sqlalchemy import ForeignKey
from .mixins import PKMixin, DatetimeMixin

class BaseModel(DeclarativeBase):
    pass

class UserModel(BaseModel, DatetimeMixin):
    __tablename__ = 'users'
    firebase_uid: Mapped[str] = mapped_column(primary_key=True, autoincrement=False)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    username: Mapped[str]
    stats: Mapped['UserStatsModel'] = relationship(
        back_populates='user', 
        cascade='all, delete-orphan',
        lazy='selectin',
    )

class UserStatsModel(BaseModel, PKMixin, DatetimeMixin):
    __tablename__ = 'user_stats'
    total_score: Mapped[int] = mapped_column(default=0)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.firebase_uid'), index=True)
    user: Mapped[UserModel] = relationship(back_populates='stats')