from app import ma
from .models import BaseModel, UserModel, UserStatsModel

class BaseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = BaseModel
        include_fk = True

class UserSchema(BaseSchema):
    class Meta:
        model = UserModel
    
    stats = ma.Nested(UserStatsModel)

class StatsSchema(BaseSchema):
    class Meta:
        model = UserStatsModel

user_schema = UserSchema()