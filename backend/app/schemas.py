from app import ma
from .models import UserModel, UserStatsModel


class StatsSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = UserStatsModel

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = UserModel
    
    stats = ma.Nested(StatsSchema)


user_schema = UserSchema()