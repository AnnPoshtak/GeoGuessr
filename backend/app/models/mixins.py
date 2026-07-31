from sqlalchemy.orm import Mapped, mapped_column
import datetime
from sqlalchemy import func

class PKMixin:
    id: Mapped[int] = mapped_column(primary_key=True)

class DatetimeMixin:
    created_at: Mapped[datetime.datetime] = mapped_column(default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(default=func.now(), server_default=func.now(), onupdate=func.now())